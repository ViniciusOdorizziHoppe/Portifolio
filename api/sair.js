// POST /api/sair  → encerra a sessão
import { q } from './_db.js';
import { json, leCookie, cookieLimpo } from './_auth.js';

export default async function handler(req, res) {
  const token = leCookie(req, 'cad_sess');
  if (token) {
    try { await q('delete from sessoes where token = $1', [token]); } catch { /* segue */ }
  }
  return json(res, 200, { ok: true }, { 'Set-Cookie': cookieLimpo() });
}
