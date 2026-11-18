// Contador de clique da oferta, disparado pelo navegador via sendBeacon no
// instante do toque. Ele vive aqui, e não dentro do /o/, porque a Vercel
// congela a função assim que o 302 é enviado, e a contagem se perdia.
//
// O beacon é uma requisição própria: sobrevive à navegação para a Shopee e
// não atrasa um milissegundo a saída do visitante.
const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';

const NAO_E_GENTE = /(bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|slack|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|curl|wget|python-|python\/|requests|axios|node-fetch|go-http|java\/|okhttp|headless|lighthouse|preview|scrapy|uptime|monitor|pingdom|gtmetrix|semrush|ahrefs)/i;

export default async function handler(req, res) {
  const id = String(req.query.i || req.query.id || '').replace(/\D/g, '');
  const origem = (String(req.query.o || 'site').replace(/[^a-zA-Z0-9]/g, '') || 'site').slice(0, 12);
  const pag = (String(req.query.p || 'achadinho').replace(/[^a-zA-Z0-9_-]/g, '') || 'achadinho').slice(0, 24);
  const ua = String(req.headers['user-agent'] || '');

  if (id && ua.length > 20 && !NAO_E_GENTE.test(ua)) {
    try {
      await fetch(`${BASE}/api/clique?id=${id}&o=${origem}&p=${pag}`, {
        signal: AbortSignal.timeout(4000),
      });
    } catch (e) { /* medição é opcional */ }
  }

  res.statusCode = 204;
  res.setHeader('cache-control', 'no-store');
  res.end();
}
