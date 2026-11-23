// Entrada do grupo de ofertas: /entrar?o=<origem>
//
// Este é o destino que o anúncio pago deve usar. A lógica vem das fontes de mercado
// (ver RELATORIO-trafego-pago-afiliado-shopee.md): o anúncio direto no produto cobra
// um clique novo para cada venda; a entrada no grupo é paga UMA vez por pessoa e
// rende comissão enquanto ela fica.
//
// Responde 302 imediatamente e conta a entrada em background, pelo mesmo motivo do
// /o/<id>: cada 100 ms aqui é gente que desiste no caminho.
import { waitUntil } from '@vercel/functions';

const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';
const GRUPO = 'https://chat.whatsapp.com/IXJEbgKnQeXFE18fbGiX6I';

// O link muda de grupo quando o primeiro lote (1.024 pessoas): trocar aqui, ou
// apontar via env GRUPO_INVITE, sem mexer em criativo nenhum.
const DESTINO = process.env.GRUPO_INVITE || GRUPO;

const NAO_E_GENTE = /(bot|crawl|spider|slurp|facebookexternalhit|telegram|discord|slack|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|curl|wget|python-|python\/|requests|axios|node-fetch|go-http|java\/|okhttp|headless|lighthouse|preview|scrapy|uptime|monitor|pingdom|gtmetrix|semrush|ahrefs|hermes)/i;

export default async function handler(req, res) {
  const origem = (String(req.query.o || 'site').replace(/[^a-zA-Z0-9_-]/g, '') || 'site').slice(0, 16);
  const pag = (String(req.query.p || 'entrar').replace(/[^a-zA-Z0-9_-]/g, '') || 'entrar').slice(0, 24);

  const ua = String(req.headers['user-agent'] || '');
  const pareceGente = req.method === 'GET' && ua.length > 20 && !NAO_E_GENTE.test(ua);

  if (pareceGente) {
    // id=grupo identifica entrada no relatório, separado dos cliques de produto.
    const registro = fetch(`${BASE}/api/clique?id=grupo&o=${origem}&p=${pag}`, {
      signal: AbortSignal.timeout(4000),
    }).catch(() => {});
    try {
      waitUntil(registro);
    } catch (e) {
      // teste local: segue sem segurar a resposta
    }
  }

  res.writeHead(302, {
    location: DESTINO,
    'cache-control': 'no-store',
    'referrer-policy': 'no-referrer-when-downgrade',
  });
  return res.end();
}
