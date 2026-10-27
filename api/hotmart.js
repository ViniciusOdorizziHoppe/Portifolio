// POST /api/hotmart  → webhook da Hotmart (cria e revoga acesso)
import { q } from './_db.js';
import { aplicarEvento } from './_dominio.js';
import { json, corpo } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { erro: 'metodo' });

  let ev;
  try {
    ev = await corpo(req);
  } catch {
    return json(res, 400, { erro: 'json' });
  }

  const esperado = process.env.HOTMART_HOTTOK || '';
  const recebido = String(ev.hottok || req.headers['x-hotmart-hottok'] || '');
  if (!esperado) return json(res, 500, { erro: 'hottok_nao_configurado' });
  if (recebido !== esperado) return json(res, 401, { erro: 'hottok_invalido' });

  const d = ev.data || {};
  const compra = d.purchase || {};
  const assinatura = d.subscription || {};
  const comprador = d.buyer || {};

  const planoNome =
    (assinatura.plan && assinatura.plan.name) ||
    (compra.offer && compra.offer.name) ||
    (compra.plan && compra.plan.name) || '';

  const entrada = {
    evento: ev.event || ev.event_name || '',
    email: comprador.email || (assinatura.subscriber && assinatura.subscriber.email) || '',
    nome: comprador.name || (assinatura.subscriber && assinatura.subscriber.name) || '',
    transacao: compra.transaction || assinatura.subscriber_code || '',
    valor: Number(compra.price && compra.price.value) || 0,
    planoNome,
    original: ev
  };

  try {
    const r = await aplicarEvento(q, entrada);
    return json(res, 200, { ok: true, ...r });
  } catch (e) {
    console.error('hotmart webhook falhou', e);
    // devolve 500 para a Hotmart tentar de novo
    return json(res, 500, { ok: false, erro: 'processamento' });
  }
}
