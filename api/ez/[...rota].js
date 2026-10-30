// /api/ez/<rota> — tudo do Enemzeiro numa função só (limite de 12 funções do plano Hobby).
import * as rotas from '../_ez-rotas.js';
import { json } from '../_ez.js';

const PLATAFORMAS = new Set(['hotmart', 'kiwify', 'eduzz', 'monetizze', 'kirvano']);

export default async function handler(req, res) {
  const partes = [].concat(req.query.rota || []).filter(Boolean);
  const rota = partes[0] || '';

  if (rota === 'webhook') {
    const plataforma = String(partes[1] || '').toLowerCase();
    if (!PLATAFORMAS.has(plataforma)) return json(res, 404, { erro: 'plataforma' });
    return rotas.webhook(req, res, plataforma);
  }

  const fn = rotas[rota];
  if (typeof fn !== 'function' || rota.startsWith('_')) {
    return json(res, 404, { erro: 'rota' });
  }
  return fn(req, res);
}
