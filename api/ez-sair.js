// POST /api/ez-sair
import { q } from './_db.js';
import { json, leCookie, cookieLimpo, metodoPermitido, ehHttps, COOKIE } from './_ez.js';
import { fecharSessao } from './_ez-dominio.js';

export default async function handler(req, res) {
  if (!metodoPermitido(req, res, ['POST'])) return;
  try { await fecharSessao(q, leCookie(req, COOKIE)); } catch { /* segue */ }
  return json(res, 200, { ok: true }, { 'Set-Cookie': cookieLimpo(ehHttps(req)) });
}
