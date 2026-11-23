// Entrada do grupo de ofertas: /entrar?o=<origem> — roda em EDGE.
//
// Este é o destino que o anúncio pago deve usar. A lógica vem das fontes de mercado
// (RELATORIO-trafego-pago-afiliado-shopee.md): anúncio direto no produto cobra um
// clique novo para cada venda; entrada no grupo é paga UMA vez por pessoa e rende
// comissão enquanto ela fica.
//
// Mesmo motivo do /o/: o POP é gru1 e a função Node rodava em iad1. Em Edge a entrada
// responde no POP, sem cruzar continente.
import { waitUntil } from '@vercel/functions';

export const config = { runtime: 'edge' };

const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';
const DESTINO = process.env.GRUPO_INVITE || 'https://chat.whatsapp.com/IXJEbgKnQeXFE18fbGiX6I';

const NAO_E_GENTE = /(bot|crawl|spider|slurp|facebookexternalhit|telegram|discord|slack|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|curl|wget|python-|python\/|requests|axios|node-fetch|go-http|java\/|okhttp|headless|lighthouse|preview|scrapy|uptime|monitor|pingdom|gtmetrix|semrush|ahrefs|hermes)/i;

function busca(url, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return fetch(url, { signal: ac.signal }).finally(() => clearTimeout(t));
}

export default async function handler(req) {
  const url = new URL(req.url);
  const origem = (String(url.searchParams.get('o') || 'site').replace(/[^a-zA-Z0-9_-]/g, '') || 'site').slice(0, 16);
  const pag = (String(url.searchParams.get('p') || 'entrar').replace(/[^a-zA-Z0-9_-]/g, '') || 'entrar').slice(0, 24);

  const ua = String(req.headers.get('user-agent') || '');
  if (ua.length > 20 && !NAO_E_GENTE.test(ua)) {
    // id=grupo identifica entrada no relatório, separado dos cliques de produto.
    const registro = busca(`${BASE}/api/clique?id=grupo&o=${origem}&p=${pag}`, 4000).catch(() => {});
    try {
      waitUntil(registro);
    } catch (e) { /* teste local */ }
  }

  return new Response(null, {
    status: 302,
    headers: {
      location: DESTINO,
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer-when-downgrade',
    },
  });
}
