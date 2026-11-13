/* ────────────────────────────────────────────────────────────────
   FB-BOT · publica ofertas na Página do Facebook e responde comentários
   Node puro (sem dependências) + Graph API. Roda na VPS, 24/7.

   Sem pageToken ele entra em MODO SIMULADO: registra o que faria,
   sem chamar o Facebook. Assim dá pra validar a fila antes do token.
   ──────────────────────────────────────────────────────────────── */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const PORTA = Number(process.env.FB_PORTA || 8100);
const DIR = process.env.FB_DIR || '/var/lib/fb-bot';
const ARQ_CONFIG = process.env.FB_CONFIG || '/etc/fb-bot/config.json';
const ARQ_FILA = path.join(DIR, 'fila.json');
const ARQ_LOG = path.join(DIR, 'log.json');
const ARQ_COMENTARIOS = path.join(DIR, 'comentarios.json');
const GRAPH = 'https://graph.facebook.com/v21.0';

/* ─────────── utilidades ─────────── */

const log = (...p) => console.log(new Date().toISOString(), ...p);
const uid = () => crypto.randomBytes(6).toString('hex');
const agora = () => new Date().toISOString();
const esc = (s) => String(s == null ? '' : s);

function responder(res, codigo, corpo) {
  res.writeHead(codigo, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(corpo, null, 2));
}

function lerCorpo(req, limite = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const pedacos = [];
    req.on('data', (c) => {
      n += c.length;
      if (n > limite) { reject(Object.assign(new Error('corpo grande'), { codigo: 413 })); req.destroy(); return; }
      pedacos.push(c);
    });
    req.on('end', () => {
      if (!pedacos.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(pedacos).toString('utf8'))); }
      catch { reject(Object.assign(new Error('json invalido'), { codigo: 400 })); }
    });
    req.on('error', reject);
  });
}

async function lerJson(arquivo, padrao) {
  try { return JSON.parse(await fsp.readFile(arquivo, 'utf8')); } catch { return padrao; }
}

async function gravar(arquivo, dados) {
  const tmp = arquivo + '.tmp-' + process.pid + '-' + Date.now();
  await fsp.writeFile(tmp, JSON.stringify(dados, null, 1), { mode: 0o600 });
  await fsp.rename(tmp, arquivo);
}

/* ─────────── configuração ─────────── */

let cfg = {};

function carregarConfig() {
  try {
    cfg = JSON.parse(fs.readFileSync(ARQ_CONFIG, 'utf8'));
  } catch (e) {
    log('ERRO: sem configuracao em', ARQ_CONFIG, '-', e.message);
    cfg = {};
  }
  cfg.graphVersao = cfg.graphVersao || 'v21.0';
  cfg.intervaloMinMinutos = Number(cfg.intervaloMinMinutos || 45);
  cfg.limiteDiario = Number(cfg.limiteDiario || 8);
  cfg.pausado = !!cfg.pausado;
  cfg.regras = Array.isArray(cfg.regras) ? cfg.regras : [];
  cfg.respostaPadrao = cfg.respostaPadrao || '';
  cfg.responderComentarios = cfg.responderComentarios !== false;
  cfg.janelaComentariosDias = Number(cfg.janelaComentariosDias || 5);
}

function temToken() {
  return !!(cfg.pageToken && cfg.pageId);
}

/* ─────────── estado em disco ─────────── */

let fila = { itens: [] };
let diario = { dia: '', publicados: 0 };
let log_ = { eventos: [] };
let comentarios = { respondidos: {}, ultimoPoll: null };

async function carregarEstado() {
  fila = await lerJson(ARQ_FILA, { itens: [] });
  if (!Array.isArray(fila.itens)) fila.itens = [];
  const l = await lerJson(ARQ_LOG, { eventos: [] });
  log_ = Array.isArray(l.eventos) ? l : { eventos: [] };
  const c = await lerJson(ARQ_COMENTARIOS, { respondidos: {} });
  comentarios = Object.assign({ respondidos: {}, ultimoPoll: null }, c);
  salvarDiario();
}

function salvarDiario() {
  const hoje = new Date().toISOString().slice(0, 10);
  if (diario.dia !== hoje) diario = { dia: hoje, publicados: 0 };
}

async function anotar(tipo, dados) {
  log_.eventos.unshift({ quando: agora(), tipo, ...dados });
  if (log_.eventos.length > 300) log_.eventos.length = 300;
  await gravar(ARQ_LOG, log_);
}

/* ─────────── Graph API ─────────── */

async function graph(caminho, opcoes = {}) {
  const url = new URL(GRAPH + caminho);
  const metodo = opcoes.metodo || 'GET';
  const corpo = new URLSearchParams();
  const params = opcoes.params || {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') corpo.set(k, String(v));
  }
  corpo.set('access_token', cfg.pageToken);

  let alvo = url.toString();
  const init = { method: metodo };
  if (metodo === 'GET') {
    alvo = url.toString() + '?' + corpo.toString();
  } else {
    init.body = corpo;
    init.headers = { 'content-type': 'application/x-www-form-urlencoded' };
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(alvo, { ...init, signal: ctrl.signal });
    const texto = await r.text();
    let dados;
    try { dados = JSON.parse(texto); } catch { dados = { bruto: texto.slice(0, 400) }; }
    if (!r.ok || dados.error) {
      const err = dados.error || {};
      return {
        ok: false,
        status: r.status,
        codigo: err.code,
        subcodigo: err.error_subcode,
        mensagem: err.message || 'falha desconhecida',
      };
    }
    return { ok: true, dados };
  } catch (e) {
    return { ok: false, mensagem: 'rede: ' + (e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

/* ─────────── publicação ─────────── */

async function publicar(item) {
  if (!temToken()) {
    log('SIMULADO: publicaria', JSON.stringify(item).slice(0, 120));
    await anotar('simulado', { itemId: item.id, texto: (item.mensagem || '').slice(0, 80) });
    return { ok: true, simulado: true, id: 'sim-' + uid() };
  }

  let r;
  if (item.imagem) {
    r = await graph('/' + cfg.pageId + '/photos', {
      metodo: 'POST',
      params: { url: item.imagem, caption: item.mensagem || '', published: 'true' },
    });
  } else {
    const params = { message: item.mensagem || '' };
    if (item.link) params.link = item.link;
    r = await graph('/' + cfg.pageId + '/feed', { metodo: 'POST', params });
  }

  if (!r.ok) {
    log('falha ao publicar', r.codigo, r.mensagem);
    if (r.codigo === 190 || r.codigo === 102) {
      await anotar('token_invalido', { mensagem: r.mensagem });
    }
    return r;
  }
  log('publicado', r.dados.id);
  return { ok: true, id: r.dados.id || r.dados.post_id };
}

/* ─────────── fila ─────────── */

function proximoDaFila() {
  if (cfg.pausado) return null;
  salvarDiario();
  if (diario.publicados >= cfg.limiteDiario) return null;

  const agoraMs = Date.now();
  const ultimo = fila.itens.filter((i) => i.publicadoEm).sort((a, b) => (a.publicadoEm < b.publicadoEm ? 1 : -1))[0];
  if (ultimo) {
    const minutos = (agoraMs - new Date(ultimo.publicadoEm).getTime()) / 60000;
    if (minutos < cfg.intervaloMinMinutos) return null;
  }

  return fila.itens.find((i) => i.status === 'pendente' && (!i.quando || new Date(i.quando).getTime() <= agoraMs)) || null;
}

async function processarFila() {
  const item = proximoDaFila();
  if (!item) return;
  item.status = 'publicando';
  await gravar(ARQ_FILA, fila);

  const r = await publicar(item);
  if (r.ok) {
    item.status = 'publicado';
    item.publicadoEm = agora();
    item.postId = r.id;
    item.erro = null;
    salvarDiario();
    diario.publicados++;
    await anotar('publicado', { itemId: item.id, postId: r.id, simulado: !!r.simulado });
  } else {
    item.status = 'erro';
    item.erro = r.mensagem;
    await anotar('erro_publicacao', { itemId: item.id, mensagem: r.mensagem, codigo: r.codigo });
  }
  await gravar(ARQ_FILA, fila);
  await gravar(path.join(DIR, 'diario.json'), diario);
}

/* ─────────── comentários ─────────── */

function escolherResposta(texto) {
  const t = String(texto || '').toLowerCase();
  for (const regra of cfg.regras) {
    const palavras = regra.palavras || [];
    if (palavras.some((p) => p && t.includes(String(p).toLowerCase()))) {
      return regra.resposta || '';
    }
  }
  return cfg.respostaPadrao || '';
}

async function pollComentarios() {
  if (!temToken() || !cfg.responderComentarios || cfg.pausado) return { pulado: true };

  const r = await graph('/' + cfg.pageId + '/posts', {
    params: {
      fields: 'id,created_time,permalink_url,comments{id,message,from,created_time,can_reply_privately}',
      limit: '15',
    },
  });
  if (!r.ok) {
    await anotar('erro_comentarios', { mensagem: r.mensagem, codigo: r.codigo });
    return { erro: r.mensagem };
  }

  const limiteMs = Date.now() - cfg.janelaComentariosDias * 86400000;
  let respondidos = 0;

  for (const post of r.dados.data || []) {
    const lista = (post.comments && post.comments.data) || [];
    for (const c of lista) {
      const id = c.id;
      const deMim = c.from && String(c.from.id) === String(cfg.pageId);
      if (deMim) continue;
      if (comentarios.respondidos[id]) continue;
      if (c.created_time && new Date(c.created_time).getTime() < limiteMs) {
        comentarios.respondidos[id] = { quando: agora(), motivo: 'antigo' };
        continue;
      }
      const resposta = escolherResposta(c.message);
      if (!resposta) {
        comentarios.respondidos[id] = { quando: agora(), motivo: 'sem_regra' };
        continue;
      }
      const envio = await graph('/' + id + '/comments', { metodo: 'POST', params: { message: resposta } });
      if (envio.ok) {
        respondidos++;
        comentarios.respondidos[id] = { quando: agora(), resposta, comentario: (c.message || '').slice(0, 120) };
        await anotar('respondeu', { comentarioId: id, texto: (c.message || '').slice(0, 60) });
      } else {
        comentarios.respondidos[id] = { quando: agora(), motivo: 'falha: ' + envio.mensagem };
        await anotar('erro_resposta', { comentarioId: id, mensagem: envio.mensagem });
      }
    }
  }

  // poda o histórico
  const chaves = Object.keys(comentarios.respondidos);
  if (chaves.length > 800) {
    for (const k of chaves.slice(0, chaves.length - 800)) delete comentarios.respondidos[k];
  }
  comentarios.ultimoPoll = agora();
  await gravar(ARQ_COMENTARIOS, comentarios);
  return { respondidos, posts: (r.dados.data || []).length };
}

async function pollComentariosSeguro() {
  try {
    const r = await pollComentarios();
    if (!r || r.pulado) return;
    if (r.erro) log('poll comentarios falhou:', r.erro);
    else if (r.respondidos) log('respondidos', r.respondidos, 'comentarios');
  } catch (e) {
    log('poll comentarios explodiu:', e.message);
  }
}

/* ─────────── painel (HTTP) ─────────── */

function chaveOk(req, url) {
  if (!cfg.chaveAdmin) return false;
  const enviada = req.headers['x-chave'] || url.searchParams.get('chave') || '';
  const a = Buffer.from(String(enviada));
  const b = Buffer.from(String(cfg.chaveAdmin));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function tratar(req, res) {
  const url = new URL(req.url, 'http://local');
  const rota = url.pathname.replace(/\/+$/, '') || '/';

  if (rota === '/fb/saude') {
    return responder(res, 200, {
      ok: true,
      servico: 'fb-bot',
      modo: temToken() ? 'producao' : 'simulado',
      pausado: cfg.pausado,
      hora: agora(),
    });
  }

  if (rota === '/fb/painel' && req.method === 'GET') {
    try {
      const html = fs.readFileSync(path.join(__dirname, 'painel.html'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(html);
    } catch {
      return responder(res, 500, { erro: 'painel.html ausente' });
    }
  }

  if (!chaveOk(req, url)) return responder(res, 401, { erro: 'chave invalida' });

  if (rota === '/fb/status' && req.method === 'GET') {
    salvarDiario();
    const pendentes = fila.itens.filter((i) => i.status === 'pendente').length;
    const publicados = fila.itens.filter((i) => i.status === 'publicado');
    return responder(res, 200, {
      modo: temToken() ? 'producao' : 'simulado',
      pagina: cfg.pageId || null,
      paginaNome: cfg.paginaNome || null,
      pausado: cfg.pausado,
      intervaloMinMinutos: cfg.intervaloMinMinutos,
      limiteDiario: cfg.limiteDiario,
      publicadosHoje: diario.publicados,
      filaPendente: pendentes,
      totalPublicados: publicados.length,
      ultimoPost: publicados[0] || null,
      ultimoPollComentarios: comentarios.ultimoPoll,
      regras: cfg.regras.length,
      respostaPadrao: !!cfg.respostaPadrao,
    });
  }

  if (rota === '/fb/verificar' && req.method === 'POST') {
    if (!temToken()) return responder(res, 400, { erro: 'sem pageToken configurado' });
    const pagina = await graph('/' + cfg.pageId, { params: { fields: 'id,name,fan_count,followers_count,link' } });
    if (!pagina.ok) return responder(res, 400, { erro: 'graph recusou', ...pagina });
    return responder(res, 200, { ok: true, pagina: pagina.dados });
  }

  if (rota === '/fb/fila' && req.method === 'GET') {
    return responder(res, 200, { total: fila.itens.length, itens: fila.itens.slice(0, 100) });
  }

  if (rota === '/fb/fila' && req.method === 'POST') {
    let corpo;
    try { corpo = await lerCorpo(req); } catch (e) { return responder(res, e.codigo || 400, { erro: e.message }); }
    const itens = Array.isArray(corpo.itens) ? corpo.itens : [corpo.item || corpo];
    const criados = [];
    for (const bruto of itens) {
      if (!bruto || (!bruto.mensagem && !bruto.link)) continue;
      const item = {
        id: uid(),
        mensagem: esc(bruto.mensagem),
        link: esc(bruto.link),
        imagem: esc(bruto.imagem),
        quando: bruto.quando || agora(),
        status: 'pendente',
        criadoEm: agora(),
        origem: esc(bruto.origem || 'manual'),
        etiqueta: esc(bruto.etiqueta || ''),
      };
      fila.itens.push(item);
      criados.push(item);
    }
    await gravar(ARQ_FILA, fila);
    await anotar('fila_recebeu', { quantidade: criados.length });
    return responder(res, 201, { ok: true, criados: criados.length, itens: criados.map((i) => ({ id: i.id, quando: i.quando, etiqueta: i.etiqueta })) });
  }

  if (rota.startsWith('/fb/fila/') && req.method === 'DELETE') {
    const id = rota.split('/').pop();
    const antes = fila.itens.length;
    fila.itens = fila.itens.filter((i) => i.id !== id);
    await gravar(ARQ_FILA, fila);
    return responder(res, 200, { ok: true, removidos: antes - fila.itens.length });
  }

  if (rota === '/fb/publicar' && req.method === 'POST') {
    let corpo;
    try { corpo = await lerCorpo(req); } catch (e) { return responder(res, e.codigo || 400, { erro: e.message }); }
    if (!corpo.mensagem && !corpo.link) return responder(res, 400, { erro: 'informe mensagem ou link' });
    const r = await publicar({
      id: 'avulso-' + uid(),
      mensagem: esc(corpo.mensagem),
      link: esc(corpo.link),
      imagem: esc(corpo.imagem),
    });
    if (!r.ok) return responder(res, 400, { erro: r.mensagem, codigo: r.codigo });
    await anotar('publicado_avulso', { postId: r.id, simulado: !!r.simulado });
    return responder(res, 200, { ok: true, postId: r.id, simulado: !!r.simulado });
  }

  if (rota === '/fb/pausar' && req.method === 'POST') {
    let corpo;
    try { corpo = await lerCorpo(req); } catch (e) { return responder(res, e.codigo || 400, { erro: e.message }); }
    cfg.pausado = !!corpo.pausado;
    await gravar(ARQ_CONFIG, cfg);
    await anotar('pausa', { pausado: cfg.pausado });
    return responder(res, 200, { ok: true, pausado: cfg.pausado });
  }

  if (rota === '/fb/comentarios' && req.method === 'GET') {
    return responder(res, 200, {
      ultimoPoll: comentarios.ultimoPoll,
      respondidos: Object.keys(comentarios.respondidos).length,
      detalhe: Object.entries(comentarios.respondidos).slice(-40).map(([id, d]) => ({ id, ...d })),
    });
  }

  if (rota === '/fb/comentarios' && req.method === 'POST') {
    const r = await pollComentarios();
    return responder(res, 200, r);
  }

  if (rota === '/fb/token' && req.method === 'POST') {
    let corpo;
    try { corpo = await lerCorpo(req); } catch (e) { return responder(res, e.codigo || 400, { erro: e.message }); }

    let pageId = String(corpo.pageId || '').trim();
    let pageToken = String(corpo.pageToken || '').trim();
    let origem = 'direto';

    // caminho 2: token de usuario (curta duracao) -> token de pagina permanente
    if (!pageToken && corpo.userToken) {
      if (!cfg.appId || !cfg.appSecret) {
        return responder(res, 400, { erro: 'para trocar o token de usuario preciso de appId e appSecret' });
      }
      const troca = await fetch(
        GRAPH + '/oauth/access_token?grant_type=fb_exchange_token' +
        '&client_id=' + encodeURIComponent(cfg.appId) +
        '&client_secret=' + encodeURIComponent(cfg.appSecret) +
        '&fb_exchange_token=' + encodeURIComponent(String(corpo.userToken))
      );
      const dTroca = await troca.json();
      if (!troca.ok || dTroca.error) {
        return responder(res, 400, { erro: 'nao consegui trocar o token', detalhe: dTroca.error && dTroca.error.message });
      }
      const contas = await fetch(
        GRAPH + '/me/accounts?fields=id,name,access_token&limit=100&access_token=' +
        encodeURIComponent(dTroca.access_token)
      );
      const dContas = await contas.json();
      if (!contas.ok || dContas.error) {
        return responder(res, 400, { erro: 'nao consegui listar as paginas', detalhe: dContas.error && dContas.error.message });
      }
      const lista = dContas.data || [];
      const escolhida = pageId ? lista.find((p) => String(p.id) === String(pageId)) : lista[0];
      if (!escolhida) {
        return responder(res, 400, {
          erro: 'nenhuma pagina encontrada para esse usuario',
          paginas: lista.map((p) => ({ id: p.id, nome: p.name })),
        });
      }
      pageId = escolhida.id;
      pageToken = escolhida.access_token;
      cfg.paginaNome = escolhida.name;
      origem = 'userToken';
    }

    if (!pageId || !pageToken) return responder(res, 400, { erro: 'informe pageToken + pageId, ou userToken' });

    // confere no Graph antes de salvar
    const teste = await fetch(
      GRAPH + '/' + pageId + '?fields=id,name,fan_count,followers_count&access_token=' + encodeURIComponent(pageToken)
    );
    const dados = await teste.json();
    if (!teste.ok || dados.error) {
      return responder(res, 400, {
        erro: 'o Facebook recusou esse token',
        detalhe: dados.error && dados.error.message,
        codigo: dados.error && dados.error.code,
      });
    }

    cfg.pageId = pageId;
    cfg.pageToken = pageToken;
    cfg.paginaNome = dados.name || cfg.paginaNome || '';
    await gravar(ARQ_CONFIG, cfg);
    await anotar('token_configurado', { pageId, pagina: cfg.paginaNome, origem });
    log('token configurado para a pagina', cfg.paginaNome, '(' + pageId + ')');
    return responder(res, 200, {
      ok: true,
      origem,
      pagina: { id: dados.id, nome: dados.name, curtidas: dados.fan_count, seguidores: dados.followers_count },
      modo: 'producao',
    });
  }

  if (rota === '/fb/rodar' && req.method === 'POST') {
    await processarFila();
    const pendentes = fila.itens.filter((i) => i.status === 'pendente').length;
    return responder(res, 200, { ok: true, pendentes });
  }

  if (rota === '/fb/log' && req.method === 'GET') {
    return responder(res, 200, { eventos: log_.eventos.slice(0, 80) });
  }

  if (rota === '/fb/regras' && req.method === 'POST') {
    let corpo;
    try { corpo = await lerCorpo(req); } catch (e) { return responder(res, e.codigo || 400, { erro: e.message }); }
    if (Array.isArray(corpo.regras)) cfg.regras = corpo.regras;
    if (typeof corpo.respostaPadrao === 'string') cfg.respostaPadrao = corpo.respostaPadrao;
    if (typeof corpo.responderComentarios === 'boolean') cfg.responderComentarios = corpo.responderComentarios;
    await gravar(ARQ_CONFIG, cfg);
    return responder(res, 200, { ok: true, regras: cfg.regras.length, respostaPadrao: !!cfg.respostaPadrao });
  }

  return responder(res, 404, { erro: 'rota desconhecida' });
}

/* ─────────── laço de trabalho ─────────── */

let trabalhando = false;

async function ciclo() {
  if (trabalhando) return;
  trabalhando = true;
  try {
    await processarFila();
  } catch (e) {
    log('ciclo de fila falhou:', e.message);
  } finally {
    trabalhando = false;
  }
}

async function iniciar() {
  await fsp.mkdir(DIR, { recursive: true });
  try {
    const st = await fsp.stat(ARQ_CONFIG);
    if (st.mode & 0o077) log('AVISO: ' + ARQ_CONFIG + ' legivel por outros usuarios');
  } catch { /* sem config ainda */ }
  carregarConfig();
  await carregarEstado();

  const servidor = http.createServer((req, res) => {
    tratar(req, res).catch((e) => {
      log('erro nao tratado:', e && e.stack ? e.stack : e);
      if (!res.headersSent) responder(res, 500, { erro: 'erro interno' });
    });
  });
  servidor.listen(PORTA, '127.0.0.1', () => {
    log('fb-bot ouvindo em 127.0.0.1:' + PORTA + ' | modo ' + (temToken() ? 'producao' : 'simulado'));
  });

  setInterval(ciclo, 60000);
  setInterval(pollComentariosSeguro, 5 * 60000);
  setTimeout(pollComentariosSeguro, 15000);
  setTimeout(ciclo, 5000);

  const encerrar = () => { log('encerrando'); servidor.close(() => process.exit(0)); setTimeout(() => process.exit(0), 3000); };
  process.on('SIGTERM', encerrar);
  process.on('SIGINT', encerrar);
}

iniciar().catch((e) => {
  log('falha ao iniciar:', e && e.stack ? e.stack : e);
  process.exit(1);
});
