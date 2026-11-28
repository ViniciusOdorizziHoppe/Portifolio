// Redireciona /o/<item_id> para a Shopee já com o sub_id.
//
// Duas rotas na mesma função:
//   ?o=wa (link que vai pro grupo de WhatsApp) -> devolve uma pagina HTML minima,
//      registra a visita no Himetrica e só então redireciona. Sem navegador nao
//      existe JS, e sem JS o Himetrica nao ve nada — era o buraco.
//   resto (card do site, /achadinho) -> 302 imediato, como sempre foi, porque
//      ali cada 100 ms a mais custa entrega.
//
// O destino sai do mapa embutido (_links.js); a VPS só é consultada se o id
// nao estiver no mapa.
import { waitUntil } from '@vercel/functions';
import LINKS from './_links.js';

const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';

const CHAVE_HIMETRICA = 'hm_3fa8f337266e3d922366cc93fd23d99697ead02d10bb4517';

// Só conta batida de navegador de gente. Crawler, preview de WhatsApp/Telegram,
// curl, teste automatizado e as minhas próprias medições (hermes-test) inflavam
// o número e nunca apareciam na Shopee.
const NAO_E_GENTE = /(bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|slack|twitterbot|linkedinbot|embedly|quora|pinterest|vkshare|curl|wget|python-|python\/|requests|axios|node-fetch|go-http|java\/|okhttp|headless|lighthouse|preview|scrapy|uptime|monitor|pingdom|gtmetrix|semrush|ahrefs|hermes)/i;

const TETO_LINK_MS = 3500;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function paginaDeSaida(destino, id, origem, extra) {
  const props = JSON.stringify(Object.assign({ id: id, origem: origem }, extra || {}))
    .replace(/</g, '\\u003c');
  const alvo = JSON.stringify(destino).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Abrindo a oferta…</title>
<link rel="preconnect" href="https://cdn.himetrica.com" crossorigin>
<style>
 html,body{margin:0;height:100%;background:#fbfbfa;color:#1d1d22;
   font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
 .w{height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}
 .b{max-width:320px}
 .faixa{height:5px;background:#f5c518;border-radius:3px;overflow:hidden;margin:0 0 18px}
 .faixa i{display:block;height:100%;width:40%;background:#111114;animation:corre 1s linear infinite}
 @keyframes corre{from{transform:translateX(-100%)}to{transform:translateX(340%)}}
 p{margin:0;font-weight:700;letter-spacing:-.2px}
 small{display:block;margin-top:8px;color:#6b6b76;font-size:12.5px}
 a{color:#111114}
</style>
<script>
(function(){
  var DESTINO = ${alvo};
  var PROPS = ${props};
  var foi = false;
  function vai(){ if (foi) return; foi = true; location.replace(DESTINO); }

  // se o destino for invalido, nao prende ninguem aqui
  if (!DESTINO || DESTINO.indexOf('http') !== 0) { vai(); return; }

  // Himetrica: registra a visita e dispara o evento do produto.
  var s = document.createElement('script');
  s.src = 'https://cdn.himetrica.com/tracker.js';
  s.setAttribute('data-api-key', '${CHAVE_HIMETRICA}');
  s.async = true;
  s.onload = function(){
    try {
      if (window.himetrica && typeof window.himetrica.track === 'function') {
        window.himetrica.track('clique_oferta', PROPS);
      }
    } catch (e) {}
    setTimeout(vai, 350);   // da tempo do evento sair; teto duro abaixo cobre o resto
  };
  s.onerror = vai;
  document.head.appendChild(s);

  // teto duro: se o tracker demorar, a oferta abre do mesmo jeito
  setTimeout(vai, 1200);

  // quem tocou no link ja pode ir sem esperar, se quiser
  document.addEventListener('click', vai);
})();
</script>
</head><body>
<div class="w"><div class="b">
  <div class="faixa"><i></i></div>
  <p>Abrindo a oferta na Shopee…</p>
  <small>Se não abrir sozinho, <a href="${esc(destino)}">toque aqui</a>.</small>
</div></div>
</body></html>`;
}

export default async function handler(req, res) {
  const id = String(req.query.id || '').replace(/\D/g, '');
  const origem = (String(req.query.o || 'site').replace(/[^a-zA-Z0-9]/g, '') || 'site').slice(0, 12);
  const pag = (String(req.query.p || 'achadinho').replace(/[^a-zA-Z0-9_-]/g, '') || 'achadinho').slice(0, 24);
  const doGrupo = origem === 'wa';

  if (!id) {
    res.writeHead(302, { location: '/achadinho', 'cache-control': 'no-store' });
    return res.end();
  }

  let destino = LINKS[id] || null;

  // Reserva: só consulta a VPS quando o id não está no mapa embutido.
  // Na rota do grupo NÃO consultamos de propósito: o mapa já tem o destino e
  // cada volta a mais aqui atrasa o clique de quem está no celular.
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

  // Contar DEPOIS de responder, em background.
  // Só conta quem veio de um card da página (Referer nosso).
  const ua = String(req.headers['user-agent'] || '');
  const referer = String(req.headers.referer || req.headers.referrer || '');
  const veioDaPagina = /viniciusodorizzi\.com|localhost|127\.0\.0\.1/.test(referer);
  const pareceGente = req.method === 'GET' && ua.length > 20 && !NAO_E_GENTE.test(ua) && veioDaPagina;

  if (pareceGente) {
    try {
      waitUntil(
        fetch(`${BASE}/api/clique?id=${id}&o=${origem}&p=${pag}`, {
          signal: AbortSignal.timeout(4000),
        }).catch(() => {}),
      );
    } catch (e) {
      fetch(`${BASE}/api/clique?id=${id}&o=${origem}&p=${pag}`, {
        signal: AbortSignal.timeout(4000),
      }).catch(() => {});
    }
  }

  // Link do grupo: manda a página que registra no Himetrica.
  if (doGrupo && req.method === 'GET' && !NAO_E_GENTE.test(ua)) {
    const html = paginaDeSaida(destino, id, origem, null);
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.himetrica.com; connect-src 'self' https:; style-src 'unsafe-inline'; img-src 'self' data: https:; base-uri 'none'; form-action 'none'",
    });
    return res.end(html);
  }

  res.writeHead(302, {
    location: destino,
    'cache-control': 'no-store',
  });
  return res.end();
}
