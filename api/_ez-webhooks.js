// Webhooks das 5 plataformas de venda. Cada wrapper passa o nome da plataforma;
// aqui ficam a verificação de origem, a extração dos campos e o mapa de status.
import crypto from 'node:crypto';

const APROVADO = new Set([
  'purchase_approved', 'purchase_complete', 'purchase_completed', 'approved', 'paid',
  'paid_out', 'completed', 'complete', 'order_approved', 'aprovado', 'aprovada',
  'authorized', 'sale_approved', 'subscription_renewed'
]);
const REEMBOLSADO = new Set([
  'purchase_refunded', 'refunded', 'chargeback', 'purchase_chargeback', 'reembolsado',
  'refund', 'med_refund'
]);
const CANCELADO = new Set([
  'purchase_canceled', 'purchase_cancelled', 'canceled', 'cancelled', 'subscription_cancellation',
  'subscription_canceled', 'subscription_cancelled', 'cancelado', 'cancelada', 'expired', 'subscription_late'
]);

/** Procura a primeira string que parece e-mail, em qualquer profundidade. */
function acharEmail(obj, prof = 0) {
  if (!obj || prof > 6) return '';
  if (typeof obj === 'string') {
    const s = obj.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? s.toLowerCase() : '';
  }
  if (Array.isArray(obj)) {
    for (const v of obj) { const r = acharEmail(v, prof + 1); if (r) return r; }
    return '';
  }
  if (typeof obj === 'object') {
    // chaves preferenciais primeiro
    const pref = ['email', 'buyer_email', 'customer_email', 'comprador_email', 'email_comprador',
                  'payer_email', 'subscriber_email', 'client_email'];
    for (const k of pref) {
      if (typeof obj[k] === 'string') { const r = acharEmail(obj[k], prof + 1); if (r) return r; }
    }
    for (const v of Object.values(obj)) { const r = acharEmail(v, prof + 1); if (r) return r; }
  }
  return '';
}

function acharTexto(obj, chaves, prof = 0) {
  if (!obj || prof > 6 || typeof obj !== 'object') return '';
  for (const k of chaves) {
    if (typeof obj[k] === 'string' && obj[k].trim()) return obj[k].trim();
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') { const r = acharTexto(v, chaves, prof + 1); if (r) return r; }
  }
  return '';
}

function acharNumero(obj, chaves, prof = 0) {
  if (!obj || prof > 6 || typeof obj !== 'object') return 0;
  for (const k of chaves) {
    const v = obj[k];
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string' && /^\d+([.,]\d+)?$/.test(v.trim())) return Number(v.replace(',', '.'));
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') { const r = acharNumero(v, chaves, prof + 1); if (r) return r; }
  }
  return 0;
}

/** Texto do evento/status, qualquer que seja o nome do campo. */
export function statusDoEvento(body) {
  const bruto = [
    body.event, body.event_name, body.status, body.order_status, body.situacao,
    body.tipo, body.transaction_status, body.payment_status, body.webhook_event_type
  ].filter(Boolean).map((v) => String(v).trim().toLowerCase());
  return bruto[0] || '';
}

export function classificar(status) {
  const s = String(status || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (APROVADO.has(s)) return 'liberar';
  if (REEMBOLSADO.has(s)) return 'reembolsado';
  if (CANCELADO.has(s)) return 'cancelado';
  return 'ignorar';
}

/** Id do evento para idempotência. Usa transação quando existe, senão hash do corpo. */
export function idDoEvento(plataforma, body, cru, status) {
  const transacao = acharTexto(body, ['transaction', 'transaction_id', 'order_id', 'pedido',
    'id', 'codigo', 'reference', 'subscriber_code', 'sale_id']);
  const base = transacao ? `${plataforma}:${transacao}:${status}` : `${plataforma}:${hash(cru)}`;
  return base.slice(0, 180);
}

function hash(s) {
  return crypto.createHash('sha256').update(String(s || '')).digest('hex').slice(0, 32);
}

/** Extrai os dados que interessam de qualquer payload. */
export function extrair(body) {
  const email = acharEmail(body);
  const nome = acharTexto(body, ['name', 'nome', 'full_name', 'buyer_name', 'customer_name', 'comprador']);
  const plano = acharTexto(body, ['plan', 'plan_name', 'offer', 'offer_name', 'product_name',
    'produto', 'product', 'nome_produto']);
  const planoNome = typeof plano === 'string' ? plano : '';
  const valor = acharNumero(body, ['value', 'price', 'valor', 'amount', 'total', 'preco']);
  return { email, nome, plano: planoNome, valor };
}

/** Confere o segredo da URL e/ou o HMAC, conforme a plataforma. */
export function origemConfiavel(plataforma, req, cru) {
  const esperadoToken = process.env[`EZ_WEBHOOK_${plataforma.toUpperCase()}_TOKEN`] || '';
  const esperadoHmac = process.env[`EZ_WEBHOOK_${plataforma.toUpperCase()}_SECRET`] || '';

  // 1) token na query (?t=...)
  if (esperadoToken) {
    const url = new URL(req.url, 'http://x');
    const recebido = url.searchParams.get('t') || url.searchParams.get('token') || '';
    if (!recebido || !timingSafe(recebido, esperadoToken)) return false;
    return true;
  }

  // 2) HMAC do corpo
  if (esperadoHmac) {
    const cabecalhos = [
      req.headers['x-hotmart-hub-signature'], req.headers['x-kiwify-signature'],
      req.headers['x-eduzz-signature'], req.headers['x-kirvano-signature'],
      req.headers['x-webhook-signature'], req.headers['signature']
    ].filter(Boolean).map(String);
    const url = new URL(req.url, 'http://x');
    const naUrl = url.searchParams.get('signature');
    if (naUrl) cabecalhos.push(String(naUrl));
    if (!cabecalhos.length) return false;
    const esperado = hmac(esperadoHmac, cru);
    return cabecalhos.some((h) => timingSafe(h.replace(/^sha256=/, ''), esperado));
  }

  // sem segredo configurado: nunca aceita (fail closed)
  return false;
}

function hmac(secret, dados) {
  return crypto.createHmac('sha256', secret).update(String(dados || '')).digest('hex');
}

function timingSafe(a, b) {
  const x = Buffer.from(String(a || ''), 'utf8');
  const y = Buffer.from(String(b || ''), 'utf8');
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

/** Aplica um evento já validado. Retorna o que aconteceu. */
export async function aplicarEvento(q, dominio, { plataforma, body, cru }) {
  const status = statusDoEvento(body);
  const acao = classificar(status);
  if (acao === 'ignorar') return { ok: true, acao: 'ignorado', status };

  const { email, nome, plano, valor } = extrair(body);
  if (!email) return { ok: false, acao, erro: 'email_ausente' };

  const id = idDoEvento(plataforma, body, cru, status);
  const novo = await dominio.registrarEvento(q, {
    id, plataforma, tipo: status, email, payload: { status, plano, valor }
  });
  if (!novo) return { ok: true, acao: 'duplicado', status, email };

  if (acao === 'liberar') {
    const conta = await dominio.liberarAcesso(q, {
      email, nome, plano, valor, origem: plataforma,
      ref: acharTexto(body, ['transaction', 'order_id', 'pedido', 'id'])
    });
    return { ok: true, acao: 'liberado', status, email, acessoAte: conta.acesso_ate };
  }

  const r = await dominio.revogarAcesso(q, { email, status: acao });
  return { ok: true, acao, status, email, conta: r };
}
