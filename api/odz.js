// Ponte entre o painel /odorizzi e a API pessoal rodando na VPS.
// O navegador fala com /api/odz?rota=... (mesma origem, respeita a CSP do site)
// e esta função repassa para a VPS, que guarda os dados atrás da chave de acesso.

const VPS = process.env.ODZ_VPS || 'http://185.115.161.188:8181';
const ROTAS = ['saude', 'entrar', 'sair', 'estado'];

export default async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://local');
  const rota = String((req.query && req.query.rota) || url.searchParams.get('rota') || '').replace(/[^a-z]/g, '');

  if (!ROTAS.includes(rota)) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ erro: 'rota desconhecida' }));
  }

  const cabecalhos = { 'content-type': 'application/json' };
  if (req.headers.authorization) cabecalhos.authorization = req.headers.authorization;

  const init = { method: req.method, headers: cabecalhos };
  if (req.method === 'PUT' || req.method === 'POST') {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  }

  const controlador = new AbortController();
  const relogio = setTimeout(() => controlador.abort(), 12000);

  try {
    const resposta = await fetch(VPS + '/odz/' + rota, { ...init, signal: controlador.signal });
    const texto = await resposta.text();
    res.statusCode = resposta.status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(texto);
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ erro: 'api indisponivel', detalhe: String((e && e.message) || e) }));
  } finally {
    clearTimeout(relogio);
  }
}
