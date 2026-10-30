// Helpers HTTP do Enemzeiro: corpo com limite, cookies, sessão e trava de acesso.
import crypto from 'node:crypto';
import { q } from './_db.js';
import { contaDaSessao, acessoLiberado } from './_ez-dominio.js';

export const COOKIE = 'ez_sess';
const LIMITE_CORPO = 64 * 1024; // 64 KB: nenhuma rota nossa precisa de mais

export function json(res, status, obj, headers) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (headers) for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(obj));
}

/** Lê o corpo cru com teto de tamanho (evita payload gigante derrubar a função). */
export async function corpoCru(req) {
  if (req.body && typeof req.body === 'object') {
    const s = JSON.stringify(req.body);
    if (s.length > LIMITE_CORPO) throw new Error('corpo_grande');
    return s;
  }
  const partes = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > LIMITE_CORPO) throw new Error('corpo_grande');
    partes.push(chunk);
  }
  return Buffer.concat(partes).toString('utf8');
}

export async function corpo(req) {
  const cru = await corpoCru(req);
  if (!cru) return {};
  const o = JSON.parse(cru);
  if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('corpo_invalido');
  return o;
}

export function ehHttps(req) {
  const proto = String((req.headers && req.headers['x-forwarded-proto']) || '').split(',')[0].trim();
  if (proto) return proto === 'https';
  return Boolean(req.socket && req.socket.encrypted);
}

export function cookieSessao(token, expira, seguro = true) {
  const max = Math.max(0, Math.floor((new Date(expira).getTime() - Date.now()) / 1000));
  const partes = [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=' + max];
  if (seguro) partes.push('Secure');
  return partes.join('; ');
}

export function cookieLimpo(seguro = true) {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` + (seguro ? '; Secure' : '');
}

export function leCookie(req, nome) {
  const bruto = req.headers && req.headers.cookie;
  if (!bruto) return null;
  for (const p of String(bruto).split(';')) {
    const i = p.indexOf('=');
    if (i < 0) continue;
    if (p.slice(0, i).trim() === nome) return decodeURIComponent(p.slice(i + 1).trim());
  }
  return null;
}

/** Conta da requisição (sessão válida). Não checa pagamento. */
export async function sessaoAtual(req) {
  return contaDaSessao(q, leCookie(req, COOKIE));
}

/**
 * Trava de acesso: exige sessão + assinatura ativa.
 * Retorna a conta ou já responde 401/403 e devolve null.
 */
export async function exigirAcesso(req, res) {
  const conta = await sessaoAtual(req);
  if (!conta) {
    json(res, 401, { ok: false, motivo: 'sem_sessao' });
    return null;
  }
  if (!acessoLiberado(conta)) {
    json(res, 403, {
      ok: false,
      motivo: 'sem_assinatura',
      email: conta.email,
      status: conta.status || 'inativo',
      acessoAte: conta.acesso_ate || null
    });
    return null;
  }
  return conta;
}

/** Chave de rate limit sem guardar IP em claro. */
export function chaveTentativa(req, email) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
    .split(',')[0].trim();
  return crypto.createHash('sha256').update(`${ip}|${email}`).digest('hex').slice(0, 40);
}

export function assinaturaHmac(secret, cru) {
  return crypto.createHmac('sha256', secret).update(cru).digest('hex');
}

/** Comparação em tempo constante (evita oráculo de timing). */
export function igualSeguro(a, b) {
  const x = Buffer.from(String(a || ''), 'utf8');
  const y = Buffer.from(String(b || ''), 'utf8');
  if (x.length !== y.length) {
    // compara de qualquer jeito para não vazar tamanho
    crypto.timingSafeEqual(x.length ? x : Buffer.alloc(1), x.length ? x : Buffer.alloc(1));
    return false;
  }
  return crypto.timingSafeEqual(x, y);
}

export function metodoPermitido(req, res, metodos) {
  if (metodos.includes(req.method)) return true;
  res.setHeader('Allow', metodos.join(', '));
  json(res, 405, { erro: 'metodo' });
  return false;
}
