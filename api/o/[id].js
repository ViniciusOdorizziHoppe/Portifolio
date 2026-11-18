// Redireciona /o/<item_id> para o link da Shopee já com o sub_id.
//
// Ordem importa: o cliente recebe o 302 ANTES da medição. Antes este arquivo
// consultava a VPS duas vezes (contador e depois o link) e só então respondia,
// o que somava ~870 ms de tela parada entre o toque e a Shopee. Agora o link
// vem do mapa embutido no deploy e a contagem roda depois da resposta.
import LINKS from './_links.js';

const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';

// Só conta batida de navegador de gente. Crawler, preview de WhatsApp/Telegram,
// curl e teste automatizado inflavam o número e nunca apareciam na Shopee.
const NAO_E_GENTE = /(bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|slack|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|curl|wget|python-|python\/|requests|axios|node-fetch|go-http|java\/|okhttp|headless|lighthouse|preview|scrapy|uptime|monitor|pingdom|gtmetrix|semrush|ahrefs)/i;

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
      const r = await fetch(`${BASE}/api/link?id=${id}&o=${origem}`, { signal: AbortSignal.timeout(3500) });
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
  // Link curto (s.shopee.com.br) descarta query extra no 301, então nele não mexe.
  if (!/s\.shopee\.com\.br/.test(destino) && /shopee\.com\.br/.test(destino)) {
    const sub = `${id}-${origem}---`;
    destino = /([?&])utm_content=[^&]*/.test(destino)
      ? destino.replace(/([?&])utm_content=[^&]*/, `$1utm_content=${sub}`)
      : destino + (destino.includes('?') ? '&' : '?') + `utm_content=${sub}`;
  }

  // resposta primeiro: quem clicou não espera a medição
  res.writeHead(302, {
    location: destino,
    'cache-control': 'no-store',
  });
  res.end();

  // medição depois da resposta, sem atrasar nem derrubar o link
  const ua = String(req.headers['user-agent'] || '');
  const pareceGente = req.method === 'GET' && ua.length > 20 && !NAO_E_GENTE.test(ua);
  if (pareceGente) {
    try {
      await fetch(`${BASE}/api/clique?id=${id}&o=${origem}&p=${pag}`, {
        signal: AbortSignal.timeout(1500),
      });
    } catch (e) { /* medição é opcional */ }
  }
}
