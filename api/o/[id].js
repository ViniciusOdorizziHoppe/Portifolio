// Redireciona /o/<item_id> para o link da Shopee já com o sub_id.
//
// O link vem do mapa embutido no deploy (_links.js), então não há consulta à VPS
// no caminho crítico. A única chamada remota é a do contador, e ela tem teto de
// tempo: se a VPS demorar, o visitante segue para a Shopee mesmo assim.
import LINKS from './_links.js';

const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';

// Só conta batida de navegador de gente. Crawler, preview de WhatsApp/Telegram,
// curl, teste automatizado e as minhas próprias medições (hermes-test) inflavam
// o número e nunca apareciam na Shopee.
const NAO_E_GENTE = /(bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|slack|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|curl|wget|python-|python\/|requests|axios|node-fetch|go-http|java\/|okhttp|headless|lighthouse|preview|scrapy|uptime|monitor|pingdom|gtmetrix|semrush|ahrefs|hermes)/i;

const TETO_CONTADOR_MS = 450;
const TETO_LINK_MS = 3500;

export default async function handler(req, res) {
  const id = String(req.query.id || '').replace(/\D/g, '');
  const origem = (String(req.query.o || 'site').replace(/[^a-zA-Z0-9]/g, '') || 'site').slice(0, 12);
  const pag = (String(req.query.p || 'achadinho').replace(/[^a-zA-Z0-9_-]/g, '') || 'achadinho').slice(0, 24);

  if (!id) {
    res.writeHead(302, { location: '/achadinho', 'cache-control': 'no-store' });
    return res.end();
  }

  let destino = LINKS[id] || null;

  // Reserva: só consulta a VPS quando o id não está no mapa embutido.
  if (!destino) {
    try {
      const r = await fetch(`${BASE}/api/link?id=${id}&o=${origem}`, { signal: AbortSignal.timeout(TETO_LINK_MS) });
      const d = await r.json();
      if (d && d.link) destino = d.link;
    } catch (e) { /* segue para o descarte abaixo */ }
  }

  if (!destino) {
    res.writeHead(302, { location: '/achadinho', 'cache-control': 'no-store' });
    return res.end();
  }

  // A Shopee lê o sub_id dentro de utm_content, no formato sub1-sub2-sub3-sub4-sub5.
  // Sem isso o relatório mostra "----" e não dá para saber qual produto pagou.
  // Link curto aceita `?sub_id=` e a Shopee sobrescreve o utm_content dele (mesma
  // mecânica que o bot de WhatsApp usa), então aqui tratamos os dois formatos.
  const sub = `${id}-${origem}---`;
  if (/s\.shopee\.com\.br/.test(destino)) {
    if (!/[?&]sub_id=/.test(destino)) {
      destino = destino + (destino.includes('?') ? '&' : '?') + `sub_id=${encodeURIComponent(sub)}`;
    }
  } else if (/shopee\.com\.br/.test(destino)) {
    destino = /([?&])utm_content=[^&]*/.test(destino)
      ? destino.replace(/([?&])utm_content=[^&]*/, `$1utm_content=${sub}`)
      : destino + (destino.includes('?') ? '&' : '?') + `utm_content=${sub}`;
  }

  // Conta antes de responder, mas com teto: 450 ms no pior caso. Contar depois da
  // resposta não funciona porque a Vercel congela a função assim que o 302 sai.
  //
  // Só conta quem veio de um card da página (Referer nosso). Sem esse filtro o número
  // do painel /cliques somava robô que passou pelo filtro de UA e prefetch de link:
  // em 20/11 marcou 4 enquanto o pixel registrou 1 clique real. O número tem que
  // servir para comparar com a Shopee, não para inflar.
  const ua = String(req.headers['user-agent'] || '');
  const referer = String(req.headers.referer || req.headers.referrer || '');
  const veioDaPagina = /viniciusodorizzi\.com|localhost|127\.0\.0\.1/.test(referer);
  const pareceGente = req.method === 'GET' && ua.length > 20 && !NAO_E_GENTE.test(ua) && veioDaPagina;
  if (pareceGente) {
    const contador = fetch(`${BASE}/api/clique?id=${id}&o=${origem}&p=${pag}`, {
      signal: AbortSignal.timeout(1200),
    }).catch(() => {});
    const teto = new Promise((r) => setTimeout(r, TETO_CONTADOR_MS));
    await Promise.race([contador, teto]);
  }

  res.writeHead(302, {
    location: destino,
    'cache-control': 'no-store',
  });
  return res.end();
}
