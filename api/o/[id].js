// Redireciona /o/<item_id> para o link da Shopee já com sub_id.
// Motivo: o link resolvido tem ~600 caracteres (gads_t_sig), fica feio e
// parece spam no WhatsApp. Aqui o link do post fica curto e a atribuição
// continua inteira, porque o 302 carrega todos os parâmetros para o destino.
const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';

export default async function handler(req, res) {
  const id = String(req.query.id || '').replace(/\D/g, '');

  if (!id) {
    res.writeHead(302, { location: '/achadinho', 'cache-control': 'no-store' });
    return res.end();
  }

  try {
    const r = await fetch(`${BASE}/api/link?id=${id}`, { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    if (d && d.link) {
      res.writeHead(302, {
        location: d.link,
        // 1h na borda: o link resolvido não muda dentro do dia
        'cache-control': 'public, max-age=1800, s-maxage=3600',
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
