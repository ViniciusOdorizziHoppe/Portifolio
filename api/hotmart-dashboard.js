// GET /api/hotmart-dashboard → vendas da Hotmart agregadas para o painel
// Protegido por HOTMART_DASH_KEY (header x-dash-key). Credenciais só no servidor.
import crypto from 'node:crypto';

const { timingSafeEqual } = crypto;

const TOKEN_URL = 'https://api-sec-vlc.hotmart.com/security/oauth/token';
const PROD_BASE = 'https://developers.hotmart.com';
const SANDBOX_BASE = 'https://sandbox.hotmart.com';

const TODOS_STATUS = [
  'APPROVED', 'BLOCKED', 'CANCELLED', 'CHARGEBACK', 'COMPLETE', 'EXPIRED',
  'NO_FUNDS', 'OVERDUE', 'PARTIALLY_REFUNDED', 'PRE_ORDER', 'PRINTED_BILLET',
  'PROCESSING_TRANSACTION', 'PROTESTED', 'REFUNDED', 'STARTED',
  'UNDER_ANALISYS', 'WAITING_PAYMENT'
];

const LIMITE_ITENS = 6000;
const MAX_PAGINAS = 40;

function json(res, codigo, corpo) {
  res.statusCode = codigo;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corpo));
}

function chaveConfere(recebida, esperada) {
  const a = Buffer.from(String(recebida || ''));
  const b = Buffer.from(String(esperada || ''));
  if (!a.length || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// token em cache no escopo do módulo (sobrevive entre invocações quentes)
let cacheToken = { valor: null, expira: 0 };

async function pegarToken(base) {
  const agora = Date.now();
  if (cacheToken.valor && cacheToken.expira > agora + 60000) return cacheToken.valor;

  const id = process.env.HOTMART_CLIENT_ID || '';
  const segredo = process.env.HOTMART_CLIENT_SECRET || '';
  const basicPronto = process.env.HOTMART_BASIC || '';

  if (!basicPronto && (!id || !segredo)) {
    const e = new Error('credenciais_ausentes');
    e.codigo = 'credenciais_ausentes';
    throw e;
  }

  const basic = basicPronto || Buffer.from(id + ':' + segredo).toString('base64');
  const url = TOKEN_URL + '?grant_type=client_credentials'
    + '&client_id=' + encodeURIComponent(id)
    + '&client_secret=' + encodeURIComponent(segredo);

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + basic
    }
  });

  const txt = await r.text();
  let d = null;
  try { d = JSON.parse(txt); } catch { /* corpo não-JSON */ }

  if (!r.ok || !d || !d.access_token) {
    const e = new Error('token_recusado');
    e.codigo = 'token_recusado';
    e.detalhe = 'HTTP ' + r.status + ' ' + txt.slice(0, 200);
    throw e;
  }

  const segundos = Number(d.expires_in) || 3600;
  cacheToken = { valor: d.access_token, expira: agora + segundos * 1000 };
  return cacheToken.valor;
}

async function buscarPagina(base, token, params) {
  const qs = new URLSearchParams();
  for (const k of Object.keys(params)) {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const url = base + '/payments/api/v1/sales/history?' + qs.toString();

  const r = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }
  });

  const txt = await r.text();
  let corpo = null;
  try { corpo = JSON.parse(txt); } catch { /* corpo não-JSON */ }

  if (r.status === 429) {
    const e = new Error('limite');
    e.codigo = 'limite';
    throw e;
  }
  if (r.status === 401) {
    cacheToken = { valor: null, expira: 0 };
    const e = new Error('nao_autorizado');
    e.codigo = 'nao_autorizado';
    throw e;
  }
  if (!r.ok) {
    const e = new Error('api');
    e.codigo = 'api';
    e.detalhe = 'HTTP ' + r.status + ' ' + txt.slice(0, 300);
    throw e;
  }
  return corpo || { items: [], page_info: {} };
}

// junta todas as páginas de um filtro de status (ou do filtro padrão, sem status)
async function coletar(base, token, filtro, avisos) {
  let statusFiltro = filtro.status; // string única ou null
  const itens = [];
  let pageToken = null;
  let maxResults = 100;
  let paginas = 0;

  while (paginas < MAX_PAGINAS) {
    const params = {
      start_date: filtro.start,
      end_date: filtro.end,
      max_results: maxResults,
      page_token: pageToken
    };
    if (statusFiltro) params.transaction_status = statusFiltro;
    if (filtro.produto) params.product_id = filtro.produto;

    let pagina;
    try {
      pagina = await buscarPagina(base, token, params);
    } catch (e) {
      // max_results acima do teto pode voltar 400 — tenta o padrão da API
      if (e.codigo === 'api' && /HTTP 400/.test(e.detalhe || '') && maxResults !== 50) {
        maxResults = 50;
        continue;
      }
      throw e;
    }

    const lote = Array.isArray(pagina.items) ? pagina.items : [];
    itens.push(...lote);
    pageToken = pagina.page_info && pagina.page_info.next_page_token;
    paginas += 1;

    if (!pageToken) break;
    if (itens.length >= LIMITE_ITENS) {
      avisos.push('Limite de ' + LIMITE_ITENS + ' vendas atingido: reduza o período.');
      break;
    }
  }
  return itens;
}

function msOuNulo(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function achatar(item) {
  const p = item.purchase || {};
  const preco = p.price || {};
  const taxa = p.hotmart_fee || {};
  const pag = p.payment || {};
  const trk = p.tracking || {};
  const oferta = p.offer || {};
  const produto = item.product || {};
  const comprador = item.buyer || {};

  const valor = Number(preco.value) || 0;
  const moeda = preco.currency_code || '';
  const taxaTotal = Number(taxa.total);
  const moedaTaxa = taxa.currency_code || '';
  const temTaxa = Number.isFinite(taxaTotal);
  // só dá para subtrair quando as moedas batem — a API pode devolver moedas diferentes
  const liquido = temTaxa && moedaTaxa === moeda ? valor - taxaTotal : null;

  return {
    transacao: p.transaction || '',
    quando: msOuNulo(p.order_date),
    aprovadaEm: msOuNulo(p.approved_date),
    status: p.status || '',
    produto: produto.name || '',
    produtoId: produto.id || null,
    comprador: comprador.name || '',
    email: comprador.email || '',
    ucode: comprador.ucode || '',
    valor,
    moeda,
    liquido,
    taxa: temTaxa ? taxaTotal : null,
    moedaTaxa,
    pagamento: pag.type || '',
    metodo: pag.method || '',
    parcelas: Number(pag.installments_number) || 1,
    oferta: oferta.code || '',
    modoOferta: oferta.payment_mode || '',
    assinatura: p.is_subscription === true,
    recorrencia: Number(p.recurrency_number) || 0,
    comissionadoComo: p.commission_as || '',
    origem: trk.source || '',
    origemSck: trk.source_sck || '',
    codigoExterno: trk.external_code || '',
    garantiaAte: msOuNulo(p.warranty_expire_date)
  };
}

function somarPor(itens, chave, campo) {
  const mapa = new Map();
  for (const it of itens) {
    const k = it[chave] || '—';
    const atual = mapa.get(k) || 0;
    mapa.set(k, atual + (campo ? Number(it[campo]) || 0 : 1));
  }
  return mapa;
}

function agregar(vendas) {
  const bruto = new Map();
  const liquido = new Map();
  const taxas = new Map();
  const porStatus = new Map();
  const porPagamento = new Map();
  const serie = new Map();
  const porProduto = new Map();
  let semLiquido = 0;

  for (const v of vendas) {
    const m = v.moeda || '—';
    bruto.set(m, (bruto.get(m) || 0) + v.valor);
    if (v.liquido === null) semLiquido += 1;
    else liquido.set(m, (liquido.get(m) || 0) + v.liquido);
    if (v.taxa !== null) taxas.set(v.moedaTaxa || '—', (taxas.get(v.moedaTaxa || '—') || 0) + v.taxa);

    porStatus.set(v.status, (porStatus.get(v.status) || 0) + 1);
    porPagamento.set(v.pagamento || '—', (porPagamento.get(v.pagamento || '—') || 0) + 1);

    const dia = v.quando ? new Date(v.quando).toISOString().slice(0, 10) : '—';
    const atual = serie.get(dia) || {};
    atual[m] = (atual[m] || 0) + v.valor;
    serie.set(dia, atual);

    const chaveProd = v.produto || '—';
    const prod = porProduto.get(chaveProd) || { produto: chaveProd, produtoId: v.produtoId, vendas: 0, valores: {} };
    prod.vendas += 1;
    prod.valores[m] = (prod.valores[m] || 0) + v.valor;
    porProduto.set(chaveProd, prod);
  }

  const lista = (mapa) => [...mapa.entries()]
    .map(([k, v]) => ({ chave: k, valor: v }))
    .sort((a, b) => b.valor - a.valor);

  return {
    bruto: lista(bruto),
    liquido: lista(liquido),
    taxas: lista(taxas),
    porStatus: lista(porStatus),
    porPagamento: lista(porPagamento),
    porProduto: [...porProduto.values()].sort((a, b) => b.vendas - a.vendas),
    serie: [...serie.entries()]
      .map(([data, valores]) => ({ data, valores }))
      .sort((a, b) => a.data.localeCompare(b.data)),
    semLiquido
  };
}

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, erro: 'metodo' });

  const esperada = process.env.HOTMART_DASH_KEY || '';
  if (!esperada) {
    return json(res, 503, {
      ok: false,
      erro: 'chave_nao_configurada',
      dica: 'Defina HOTMART_DASH_KEY nas variáveis de ambiente do projeto na Vercel.'
    });
  }

  const recebida = req.headers['x-dash-key'] || (req.query && req.query.k) || '';
  if (!chaveConfere(recebida, esperada)) {
    return json(res, 401, { ok: false, erro: 'chave_invalida' });
  }

  const q = req.query || {};
  const agora = Date.now();
  const dias = Math.min(Math.max(Number(q.dias) || 30, 1), 730);
  const de = Number(q.de) || (agora - dias * 86400000);
  const ate = Number(q.ate) || agora;
  const produto = String(q.produto || '').replace(/\D/g, '');

  // status: CSV; vazio = filtro padrão da Hotmart (APPROVED + COMPLETE)
  let statusPedidos = String(q.status || '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => TODOS_STATUS.includes(s));

  if (q.status === 'TODOS') statusPedidos = TODOS_STATUS.slice();
  if (statusPedidos.length > TODOS_STATUS.length) statusPedidos = statusPedidos.slice(0, TODOS_STATUS.length);

  const base = process.env.HOTMART_SANDBOX === '1' ? SANDBOX_BASE : PROD_BASE;
  const avisos = [];

  try {
    const token = await pegarToken(base);

    const filtros = statusPedidos.length
      ? statusPedidos.map((s) => ({ start: de, end: ate, produto, status: s }))
      : [{ start: de, end: ate, produto, status: null }];

    if (!statusPedidos.length) {
      avisos.push('Sem filtro de status a Hotmart devolve apenas APPROVED e COMPLETE.');
    } else if (statusPedidos.length > 3) {
      avisos.push('Consultando ' + statusPedidos.length + ' status, uma chamada por status.');
    }

    const vistos = new Map();
    for (const filtro of filtros) {
      const lote = await coletar(base, token, filtro, avisos);
      for (const bruto of lote) {
        const v = achatar(bruto);
        if (!v.transacao) continue;
        const chave = v.transacao + '|' + v.status;
        if (!vistos.has(chave)) vistos.set(chave, v);
      }
    }

    const vendas = [...vistos.values()].sort((a, b) => (b.quando || 0) - (a.quando || 0));
    const resumo = agregar(vendas);

    return json(res, 200, {
      ok: true,
      ambiente: process.env.HOTMART_SANDBOX === '1' ? 'sandbox' : 'producao',
      janela: { de, ate, dias },
      statusConsultados: statusPedidos.length ? statusPedidos : ['APPROVED', 'COMPLETE'],
      total: vendas.length,
      resumo,
      vendas,
      avisos
    });
  } catch (e) {
    const codigo = e.codigo || 'erro';
    console.error('hotmart-dashboard:', codigo, e.detalhe || e.message);
    const mapa = {
      credenciais_ausentes: [503, 'Configure HOTMART_CLIENT_ID e HOTMART_CLIENT_SECRET na Vercel.'],
      token_recusado: [502, 'A Hotmart recusou as credenciais.'],
      nao_autorizado: [502, 'Token recusado ou expirado na chamada da API.'],
      limite: [429, 'Limite de 500 chamadas por minuto da Hotmart atingido. Tente de novo em 1 minuto.']
    };
    const [codigoHttp, dica] = mapa[codigo] || [502, 'Falha ao consultar a Hotmart.'];
    return json(res, codigoHttp, { ok: false, erro: codigo, dica, detalhe: e.detalhe || e.message });
  }
}
