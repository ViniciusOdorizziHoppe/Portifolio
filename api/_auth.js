// Hash de senha, sessões e cookies. Nada de dependência externa.
import crypto from 'node:crypto';
import { q } from './_db.js';

const DIAS_SESSAO = 30;
const COOKIE = 'cad_sess';

export function hashSenha(senha) {
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(senha), sal, 64).toString('hex');
  return 's1$' + sal + '$' + hash;
}

export function confereSenha(senha, guardado) {
  if (!guardado || guardado.indexOf('s1$') !== 0) return false;
  const [, sal, hash] = guardado.split('$');
  const teste = crypto.scryptSync(String(senha), sal, 64).toString('hex');
  const a = Buffer.from(teste, 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function senhaForte(senha) {
  return typeof senha === 'string' && senha.length >= 6;
}

export async function abrirSessao(contaId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expira = new Date(Date.now() + DIAS_SESSAO * 86400000);
  await q(
    'insert into sessoes (token, conta_id, expira_em) values ($1, $2, $3)',
    [token, contaId, expira]
  );
  return { token, expira };
}

export function leCookie(req, nome) {
  const bruto = req.headers && req.headers.cookie;
  if (!bruto) return null;
  const partes = String(bruto).split(';');
  for (const p of partes) {
    const i = p.indexOf('=');
    if (i < 0) continue;
    if (p.slice(0, i).trim() === nome) return decodeURIComponent(p.slice(i + 1).trim());
  }
  return null;
}

export function cookieSessao(token, expira) {
  const max = Math.max(0, Math.floor((new Date(expira).getTime() - Date.now()) / 1000));
  return [
    COOKIE + '=' + token,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=' + max
  ].join('; ');
}

export function cookieLimpo() {
  return COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

// Conta dona da requisição, se a sessão estiver válida e a assinatura ativa.
export async function contaDaRequisicao(req) {
  const token = leCookie(req, COOKIE);
  if (!token) return null;
  const r = await q(
    `select c.id, c.email, c.nome, c.status, c.plano, c.acesso_ate
       from sessoes s join contas c on c.id = s.conta_id
      where s.token = $1 and s.expira_em > now()`,
    [token]
  );
  const conta = r.rows[0];
  if (!conta) return null;
  if (conta.status !== 'ativo') return { ...conta, liberado: false, motivo: conta.status };
  const ate = conta.acesso_ate ? new Date(conta.acesso_ate) : null;
  if (ate && ate.getTime() < Date.now()) return { ...conta, liberado: false, motivo: 'expirado' };
  return { ...conta, liberado: true };
}

export function json(res, codigo, corpo, headers) {
  res.statusCode = codigo;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (headers) for (const k of Object.keys(headers)) res.setHeader(k, headers[k]);
  res.end(JSON.stringify(corpo));
}

export async function corpo(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const pedacos = [];
  for await (const c of req) pedacos.push(c);
  const txt = Buffer.concat(pedacos).toString('utf8');
  if (!txt) return {};
  try { return JSON.parse(txt); } catch { return {}; }
}

export function emailLimpo(e) {
  return String(e || '').trim().toLowerCase();
}
