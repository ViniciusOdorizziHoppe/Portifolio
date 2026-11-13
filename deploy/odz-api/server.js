/* ────────────────────────────────────────────────────────────────
   ODORIZZI · API pessoal
   Guarda o estado do painel (patrimônio, rendas, gastos, agenda)
   atrás de chave de acesso. Node puro, sem dependências.
   ──────────────────────────────────────────────────────────────── */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const PORTA = Number(process.env.ODZ_PORTA || 8099);
const DIR = process.env.ODZ_DIR || '/var/lib/odz';
const ARQ_ESTADO = path.join(DIR, 'estado.json');
const ARQ_SESSOES = path.join(DIR, 'sessoes.json');
const DIR_BACKUP = path.join(DIR, 'backups');
const ARQ_CHAVE = process.env.ODZ_CHAVE || '/etc/odz/pin.hash';
const LIMITE_CORPO = 4 * 1024 * 1024;      // 4 MB
const DIAS_SESSAO = 30;
const MAX_BACKUPS = 40;

/* ─────────── utilidades ─────────── */

function log(...partes) {
  console.log(new Date().toISOString(), ...partes);
}

function responder(res, codigo, corpo) {
  const txt = JSON.stringify(corpo);
  res.writeHead(codigo, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(txt);
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let tamanho = 0;
    const pedacos = [];
    req.on('data', (c) => {
      tamanho += c.length;
      if (tamanho > LIMITE_CORPO) {
        reject(Object.assign(new Error('corpo grande demais'), { codigo: 413 }));
        req.destroy();
        return;
      }
      pedacos.push(c);
    });
    req.on('end', () => {
      if (!pedacos.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(pedacos).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('json invalido'), { codigo: 400 }));
      }
    });
    req.on('error', reject);
  });
}

async function gravarAtomico(arquivo, dados) {
  const tmp = arquivo + '.tmp-' + process.pid + '-' + Date.now();
  await fsp.writeFile(tmp, JSON.stringify(dados), { mode: 0o600 });
  await fsp.rename(tmp, arquivo);
}

async function lerJson(arquivo, padrao) {
  try {
    return JSON.parse(await fsp.readFile(arquivo, 'utf8'));
  } catch {
    return padrao;
  }
}

/* ─────────── chave de acesso ─────────── */

let hashChave = null;

function carregarChave() {
  try {
    hashChave = fs.readFileSync(ARQ_CHAVE, 'utf8').trim();
    if (!hashChave.startsWith('scrypt$')) throw new Error('formato');
  } catch (e) {
    log('ERRO: chave de acesso ausente ou invalida em', ARQ_CHAVE, '-', e.message);
    process.exit(1);
  }
}

function confereChave(tentativa) {
  if (!hashChave) return false;
  const [, sal, alvo] = hashChave.split('$');
  const teste = crypto.scryptSync(String(tentativa), sal, 64);
  const alvoBuf = Buffer.from(alvo, 'hex');
  if (alvoBuf.length !== teste.length) return false;
  return crypto.timingSafeEqual(teste, alvoBuf);
}

/* ─────────── sessões ─────────── */

let sessoes = {};

async function carregarSessoes() {
  sessoes = await lerJson(ARQ_SESSOES, {});
  const agora = Date.now();
  let mudou = false;
  for (const [h, s] of Object.entries(sessoes)) {
    if (!s || s.expiraEm < agora) { delete sessoes[h]; mudou = true; }
  }
  if (mudou) await gravarAtomico(ARQ_SESSOES, sessoes);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function criarSessao() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiraEm = Date.now() + DIAS_SESSAO * 86400000;
  sessoes[hashToken(token)] = { expiraEm, criadoEm: Date.now() };
  await gravarAtomico(ARQ_SESSOES, sessoes);
  return { token, expiraEm };
}

function tokenDaRequisicao(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+([a-f0-9]{64})$/i.exec(h.trim());
  return m ? m[1] : null;
}

function sessaoValida(req) {
  const token = tokenDaRequisicao(req);
  if (!token) return false;
  const s = sessoes[hashToken(token)];
  return !!(s && s.expiraEm > Date.now());
}

/* ─────────── limite de tentativas ─────────── */

const tentativas = new Map(); // ip -> { falhas, reiniciaEm, req, janela }

function ipDe(req) {
  const encaminhado = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '';
  return String(encaminhado).split(',')[0].trim() || req.socket.remoteAddress || 'desconhecido';
}

function podeTentar(ip) {
  const agora = Date.now();
  const t = tentativas.get(ip) || { falhas: 0, reiniciaEm: agora + 3600000, req: 0, janela: agora };
  if (agora > t.reiniciaEm) { t.falhas = 0; t.reiniciaEm = agora + 3600000; }
  if (agora - t.janela > 60000) { t.req = 0; t.janela = agora; }
  tentativas.set(ip, t);
  t.req++;
  if (t.req > 120) return { ok: false, motivo: 'muitas requisicoes' };
  if (t.falhas >= 8) return { ok: false, motivo: 'muitas tentativas de chave' };
  return { ok: true, t };
}

/* ─────────── backups ─────────── */

async function backup() {
  try {
    await fsp.mkdir(DIR_BACKUP, { recursive: true });
    if (!fs.existsSync(ARQ_ESTADO)) return null;
    const nome = 'estado-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    await fsp.copyFile(ARQ_ESTADO, path.join(DIR_BACKUP, nome));
    const arqs = (await fsp.readdir(DIR_BACKUP)).filter((f) => f.endsWith('.json')).sort();
    while (arqs.length > MAX_BACKUPS) {
      await fsp.unlink(path.join(DIR_BACKUP, arqs.shift())).catch(() => {});
    }
    return nome;
  } catch (e) {
    log('aviso: backup falhou', e.message);
    return null;
  }
}

/* ─────────── rotas ─────────── */

async function tratar(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const rota = url.pathname.replace(/\/+$/, '') || '/';
  const ip = ipDe(req);

  // saúde: pública, só o essencial
  if (rota === '/odz/saude' && req.method === 'GET') {
    return responder(res, 200, { ok: true, servico: 'odorizzi-api', hora: new Date().toISOString() });
  }

  const limite = podeTentar(ip);
  if (!limite.ok) {
    log('limite:', ip, limite.motivo);
    return responder(res, 429, { erro: limite.motivo });
  }

  if (rota === '/odz/entrar' && req.method === 'POST') {
    let corpo;
    try { corpo = await lerCorpo(req); } catch (e) { return responder(res, e.codigo || 400, { erro: e.message }); }
    const chave = String(corpo.chave || '');
    if (!chave) return responder(res, 400, { erro: 'informe a chave' });
    if (!confereChave(chave)) {
      limite.t.falhas++;
      log('chave errada de', ip, '(falha', limite.t.falhas + ')');
      await new Promise((r) => setTimeout(r, 400)); // atraso contra forca bruta
      return responder(res, 401, { erro: 'chave incorreta' });
    }
    limite.t.falhas = 0;
    const { token, expiraEm } = await criarSessao();
    log('sessao aberta para', ip);
    return responder(res, 200, { ok: true, token, expiraEm: new Date(expiraEm).toISOString() });
  }

  if (rota === '/odz/sair' && req.method === 'POST') {
    const token = tokenDaRequisicao(req);
    if (token) {
      delete sessoes[hashToken(token)];
      await gravarAtomico(ARQ_SESSOES, sessoes);
    }
    return responder(res, 200, { ok: true });
  }

  if (rota === '/odz/estado') {
    if (!sessaoValida(req)) return responder(res, 401, { erro: 'sessao invalida' });

    if (req.method === 'GET') {
      const guardado = await lerJson(ARQ_ESTADO, null);
      if (!guardado) return responder(res, 200, { vazio: true, estado: null });
      return responder(res, 200, guardado);
    }

    if (req.method === 'PUT') {
      let corpo;
      try { corpo = await lerCorpo(req); } catch (e) { return responder(res, e.codigo || 400, { erro: e.message }); }
      const estado = corpo && corpo.estado;
      if (!estado || typeof estado !== 'object' || !Array.isArray(estado.lancamentos)) {
        return responder(res, 400, { erro: 'estado invalido' });
      }
      const atualizadoEm = corpo.atualizadoEm || new Date().toISOString();
      const arquivo = await backup();
      await gravarAtomico(ARQ_ESTADO, { estado, atualizadoEm, salvoEm: new Date().toISOString() });
      log('estado salvo:', estado.lancamentos.length, 'lancamentos, backup', arquivo || '-');
      return responder(res, 200, { ok: true, atualizadoEm, backup: arquivo });
    }

    return responder(res, 405, { erro: 'metodo nao permitido' });
  }

  return responder(res, 404, { erro: 'nao encontrado' });
}

/* ─────────── início ─────────── */

async function iniciar() {
  await fsp.mkdir(DIR, { recursive: true });
  await fsp.mkdir(DIR_BACKUP, { recursive: true });
  carregarChave();
  await carregarSessoes();

  const servidor = http.createServer((req, res) => {
    tratar(req, res).catch((e) => {
      log('erro nao tratado:', e && e.stack ? e.stack : e);
      if (!res.headersSent) responder(res, 500, { erro: 'erro interno' });
    });
  });

  servidor.headersTimeout = 20000;
  servidor.requestTimeout = 30000;

  servidor.listen(PORTA, '127.0.0.1', () => {
    log('odorizzi-api ouvindo em 127.0.0.1:' + PORTA + ' | dados em ' + DIR);
  });

  const encerrar = () => {
    log('encerrando...');
    servidor.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000);
  };
  process.on('SIGTERM', encerrar);
  process.on('SIGINT', encerrar);
}

iniciar().catch((e) => {
  log('falha ao iniciar:', e && e.stack ? e.stack : e);
  process.exit(1);
});
