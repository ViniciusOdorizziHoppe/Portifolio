// Handler único dos webhooks; cada rota passa o nome da plataforma.
import { q } from './_db.js';
import { json, corpoCru, metodoPermitido } from './_ez.js';
import * as dominio from './_ez-dominio.js';
import { origemConfiavel, aplicarEvento } from './_ez-webhooks.js';

export async function tratarWebhook(req, res, plataforma) {
  if (!metodoPermitido(req, res, ['POST'])) return;

  let cru = '';
  try { cru = await corpoCru(req); } catch { return json(res, 413, { erro: 'corpo_grande' }); }

  // fail closed: sem segredo configurado, nada passa
  if (!origemConfiavel(plataforma, req, cru)) {
    return json(res, 401, { ok: false, erro: 'origem_nao_confiavel' });
  }

  let body;
  try { body = JSON.parse(cru); }
  catch { body = Object.fromEntries(new URLSearchParams(cru).entries()); }

  try {
    const r = await aplicarEvento(q, dominio, { plataforma, body, cru });
    // 422 sinaliza problema de contrato (sem e-mail): não adianta a plataforma repetir
    return json(res, r.ok ? 200 : 422, r);
  } catch (e) {
    console.error('webhook falhou', plataforma, e);
    return json(res, 500, { ok: false, erro: 'processamento' });
  }
}
