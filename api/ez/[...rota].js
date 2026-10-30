// /api/ez/<rota> — tudo do Enemzeiro numa função só (limite de 12 funções do plano Hobby).
import * as rotas from '../_ez-rotas.js';
import { json } from '../_ez.js';
import { urlDoBanco } from '../_db.js';

const PLATAFORMAS = new Set(['hotmart', 'kiwify', 'eduzz', 'monetizze', 'kirvano']);

/** A rota vem da própria URL: funciona mesmo quando o runtime não popula req.query. */
function partesDaRota(req) {
  if (req.query && req.query.rota) return [].concat(req.query.rota).filter(Boolean);
  const caminho = String(req.url || '').split('?')[0];
  return caminho.replace(/^\/api\/ez\/?/, '').split('/').filter(Boolean);
}

export default async function handler(req, res) {
  // sem banco configurado nada funciona: responde claro em vez de estourar
  if (!urlDoBanco()) {
    return json(res, 503, { ok: false, erro: 'banco_nao_configurado',
      mensagem: 'Defina DATABASE_URL nas variáveis de ambiente do projeto.' });
  }

  const partes = partesDaRota(req);
  const rota = String(partes[0] || '').toLowerCase();

  if (rota === 'webhook') {
    const plataforma = String(partes[1] || '').toLowerCase();
    if (!PLATAFORMAS.has(plataforma)) return json(res, 404, { erro: 'plataforma' });
    return rotas.webhook(req, res, plataforma);
  }
  if (rota.startsWith('webhook-')) {
    const plataforma = rota.slice('webhook-'.length);
    if (!PLATAFORMAS.has(plataforma)) return json(res, 404, { erro: 'plataforma' });
    return rotas.webhook(req, res, plataforma);
  }

  const fn = rotas[rota];
  if (typeof fn !== 'function' || rota.startsWith('_')) {
    return json(res, 404, { erro: 'rota' });
  }
  try {
    return await fn(req, res);
  } catch (e) {
    console.error('ez/' + rota, e);
    return json(res, 500, { ok: false, erro: 'interno', d: String(e && e.message || e).slice(0, 300) });
  }
}
