// Redireciona /o/<item_id> para o link da Shopee já com sub_id.
// Antes de sair, registra o clique na VPS (é assim que a página /achadinho
// descobre qual oferta o pessoal procura mais). O 302 carrega todos os
// parâmetros de atribuição para o destino.
const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';

export default async function handler(req, res) {
  const id = String(req.query.id || '').replace(/\D/g, '');
  const origem = (String(req.query.o || 'site').replace(/[^a-zA-Z0-9]/g, '') || 'site').slice(0, 12);
  const pag = (String(req.query.p || 'achadinho').replace(/[^a-zA-Z0-9_-]/g, '') || 'achadinho').slice(0, 24);

  if (!id) {
    res.writeHead(302, { location: '/achadinho', 'cache-control': 'no-store' });
    return res.end();
  }

  // conta o clique: no máximo 1s, e erro aqui nunca derruba o link
  try {
    await fetch(`${BASE}/api/clique?id=${id}&o=${origem}&p=${pag}`, {
      signal: AbortSignal.timeout(1000),
    });
  } catch { /* medição é opcional */ }

  try {
    const r = await fetch(`${BASE}/api/link?id=${id}&o=${origem}`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    if (d && d.link) {
      res.writeHead(302, {
        location: d.link,
        // sem cache: com resposta cacheada na borda o clique deixaria de ser contado
        'cache-control': 'no-store',
      });
      return res.end();
    }
    throw new Error((d && d.erro) || 'sem link');
  } catch (e) {
    // VPS fora do ar não pode virar link morto: manda para a página de entrada
    res.writeHead(302, { location: 'https://www.viniciusodorizzi.com/achadinho', 'cache-control': 'no-store' });
    return res.end();
  }
}
