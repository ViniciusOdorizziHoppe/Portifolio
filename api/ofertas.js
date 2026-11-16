// Ponte para a API da VPS (a página é https e a API é http, então não dá para
// chamar direto do navegador: mixed content + CORS). Aqui roda no servidor.
const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';

export default async function handler(req, res) {
  const linkId = String(req.query.link || '').trim();
  const n = Math.max(1, Math.min(100, Number(req.query.n) || 60));

  const alvo = linkId
    ? `${BASE}/api/link?id=${encodeURIComponent(linkId)}`
    : `${BASE}/api/ofertas-hoje?n=${n}`;

  try {
    const r = await fetch(alvo, {
      headers: { 'user-agent': 'hermes-ofertas/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    const corpo = await r.text();
    res.statusCode = r.status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    // preço muda; 5 min de cache na borda é o suficiente
    res.setHeader('cache-control', linkId ? 'no-store' : 's-maxage=300, stale-while-revalidate=600');
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
