// Proxy da imagem do produto: o CDN da Shopee não manda CORS, então o
// navegador não consegue baixar a foto para compartilhar no WhatsApp.
// Aqui o download acontece no servidor e o arquivo sai na mesma origem.
const PERMITIDO = /^https:\/\/cf\.shopee\.com\.br\/file\/[A-Za-z0-9_.-]+$/;

export default async function handler(req, res) {
  const src = String(req.query.src || '');

  if (!PERMITIDO.test(src)) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ erro: 'src inválido' }));
  }

  try {
    const r = await fetch(src, {
      headers: { 'user-agent': 'Mozilla/5.0', accept: 'image/*' },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) throw new Error('CDN respondeu ' + r.status);

    const buf = Buffer.from(await r.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('content-type', r.headers.get('content-type') || 'image/jpeg');
    res.setHeader('cache-control', 'public, max-age=86400, s-maxage=604800, immutable');
    res.setHeader('access-control-allow-origin', '*');
    return res.end(buf);
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ erro: 'não consegui baixar a imagem', detalhe: String(e.message || e) }));
  }
}
