// Redireciona /o/<item_id> para o link da Shopee já com sub_id.
// Antes de sair, registra o clique na VPS (é assim que a página /achadinho
// descobre qual oferta o pessoal procura mais). O 302 carrega todos os
// parâmetros de atribuição para o destino.
const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';

// Só conta batida de navegador de gente. Crawler, preview de WhatsApp/Telegram,
// curl e test automatizado inflavam o número e nunca apareciam na Shopee.
const NAO_E_GENTE = /(bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|slack|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|curl|wget|python-|python\/|requests|axios|node-fetch|go-http|java\/|okhttp|headless|lighthouse|preview|scrapy|uptime|monitor|pingdom|gtmetrix|semrush|ahrefs)/i;

export default async function handler(req, res) {
  const id = String(req.query.id || '').replace(/\D/g, '');
  const origem = (String(req.query.o || 'site').replace(/[^a-zA-Z0-9]/g, '') || 'site').slice(0, 12);
  const pag = (String(req.query.p || 'achadinho').replace(/[^a-zA-Z0-9_-]/g, '') || 'achadinho').slice(0, 24);

  if (!id) {
    res.writeHead(302, { location: '/achadinho', 'cache-control': 'no-store' });
    return res.end();
  }

  const ua = String(req.headers['user-agent'] || '');
  const pareceGente = req.method === 'GET' && ua.length > 20 && !NAO_E_GENTE.test(ua);

  // conta o clique: no máximo 1s, e erro aqui nunca derruba o link
  if (pareceGente) {
    try {
      await fetch(`${BASE}/api/clique?id=${id}&o=${origem}&p=${pag}`, {
        signal: AbortSignal.timeout(1000),
      });
    } catch { /* medição é opcional */ }
  }

  try {
    const r = await fetch(`${BASE}/api/link?id=${id}&o=${origem}`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    if (d && d.link) {
      let destino = d.link;

      // A Shopee le o sub_id dentro de utm_content, no formato
      // sub1-sub2-sub3-sub4-sub5. Sem isso o relatorio mostra "----" e nao da
      // para saber qual produto gerou a comissao. Link curto (s.shopee.com.br)
      // descarta query extra no 301, entao nele nao mexe.
      if (!/s\.shopee\.com\.br/.test(destino) && /shopee\.com\.br/.test(destino)) {
        const sub = `${id}-${origem}---`;
        destino = /([?&])utm_content=[^&]*/.test(destino)
          ? destino.replace(/([?&])utm_content=[^&]*/, `$1utm_content=${sub}`)
          : destino + (destino.includes('?') ? '&' : '?') + `utm_content=${sub}`;
      }

      res.writeHead(302, {
        location: destino,
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
