// Redireciona /o/<item_id> para o link da Shopee já com o sub_id. Roda em EDGE.
//
// Por que Edge: medido em 22/11/2026, o POP da Vercel para este site é gru1 (São Paulo)
// mas a função Node rodava em iad1 (Washington). Cada clique pagava ~280 ms de ida e
// volta até os EUA antes de começar o redirect: TTFB de 380 ms contra 100 ms de um
// arquivo estático no mesmo POP. Edge executa no POP, então o redirect sai local.
//
// Render antes desta versão: 1,10 s até a Shopee (com 308 de apex->www e 450 ms de
// espera do contador). Taxa de entrega do clique estava em 8%.
import { waitUntil } from '@vercel/functions';
import LINKS from './_links.js';

export const config = { runtime: 'edge' };

const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';

const NAO_E_GENTE = /(bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|slack|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|curl|wget|python-|python\/|requests|axios|node-fetch|go-http|java\/|okhttp|headless|lighthouse|preview|scrapy|uptime|monitor|pingdom|gtmetrix|semrush|ahrefs|hermes)/i;

function sai(location) {
  return new Response(null, {
    status: 302,
    headers: { location, 'cache-control': 'no-store' },
  });
}

function busca(url, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return fetch(url, { signal: ac.signal }).finally(() => clearTimeout(t));
}

export default async function handler(req) {
  const url = new URL(req.url);
  const id = String(url.searchParams.get('id') || '').replace(/\D/g, '');
  const origem = (String(url.searchParams.get('o') || 'site').replace(/[^a-zA-Z0-9]/g, '') || 'site').slice(0, 12);
  const pag = (String(url.searchParams.get('p') || 'achadinho').replace(/[^a-zA-Z0-9_-]/g, '') || 'achadinho').slice(0, 24);

  if (!id) return sai('/achadinho');

  let destino = LINKS[id] || null;

  // Reserva: só consulta a VPS quando o id não está no mapa embutido.
  if (!destino) {
    try {
      const r = await busca(`${BASE}/api/link?id=${id}&o=${origem}`, 3500);
      const d = await r.json();
      if (d && d.link) destino = d.link;
    } catch (e) { /* segue para o descarte abaixo */ }
  }

  if (!destino) return sai('/achadinho');

  // A Shopee lê o sub_id dentro de utm_content (5 campos separados por hífen).
  // Sem isso o relatório mostra "----" e não dá para saber qual produto pagou.
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

  // Contar DEPOIS de responder. Só conta quem veio de um card nosso (Referer),
  // porque sem esse filtro o painel somava robô e prefetch de link.
  const ua = String(req.headers.get('user-agent') || '');
  const referer = String(req.headers.get('referer') || '');
  const veioDaPagina = /viniciusodorizzi\.com|localhost|127\.0\.0\.1/.test(referer);
  const pareceGente = ua.length > 20 && !NAO_E_GENTE.test(ua) && veioDaPagina;

  if (pareceGente) {
    try {
      waitUntil(busca(`${BASE}/api/clique?id=${id}&o=${origem}&p=${pag}`, 4000).catch(() => {}));
    } catch (e) {
      busca(`${BASE}/api/clique?id=${id}&o=${origem}&p=${pag}`, 4000).catch(() => {});
    }
  }

  return sai(destino);
}
