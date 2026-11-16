// Relatório de cliques da página /achadinho: quantas vezes cada oferta foi aberta,
// por origem (site, wa, oferta) e por dia. Ponte para a VPS, mesma ideia do /api/ofertas.
const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';

export default async function handler(req, res) {
  const dias = Math.max(1, Math.min(90, Number(req.query.dias) || 7));

  try {
    const r = await fetch(`${BASE}/api/cliques?dias=${dias}`, {
      headers: { 'user-agent': 'hermes-cliques/1.0' },
      signal: AbortSignal.timeout(12000),
    });
    const corpo = await r.text();
    res.statusCode = r.status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    return res.end(corpo);
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({
      erro: 'não consegui falar com a VPS agora',
      detalhe: String((e && e.message) || e),
    }));
  }
}
