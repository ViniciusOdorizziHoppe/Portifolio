// Relatório de cliques da página /achadinho: quantas vezes cada oferta foi aberta,
// por origem (site, wa, oferta) e por dia. Ponte para a VPS, mesma ideia do /api/ofertas.
//
// Entrada no grupo do WhatsApp é contada pelo /entrar com um id numérico fixo
// (GRUPO_ID), porque o contador da VPS descarta id de texto. Aqui esse id volta
// a aparecer com nome legível e separado no topo da resposta.
const BASE = process.env.OFERTAS_API || 'http://185.115.161.188:8184';
const GRUPO_ID = process.env.GRUPO_ID || '1000000000001';
const NOME_GRUPO = 'Entradas no grupo (WhatsApp)';

export default async function handler(req, res) {
  const dias = Math.max(1, Math.min(90, Number(req.query.dias) || 7));

  try {
    const r = await fetch(`${BASE}/api/cliques?dias=${dias}`, {
      headers: { 'user-agent': 'hermes-cliques/1.0' },
      signal: AbortSignal.timeout(12000),
    });
    const texto = await r.text();

    let corpo = null;
    try {
      corpo = JSON.parse(texto);
    } catch (e) {
      corpo = null;
    }

    res.statusCode = r.status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');

    if (!corpo || !Array.isArray(corpo.cliques)) return res.end(texto);

    let grupo = null;
    const cliques = corpo.cliques.map((c) => {
      if (String(c.id) === GRUPO_ID) {
        grupo = c;
        return { ...c, nome: NOME_GRUPO, tipo: 'grupo' };
      }
      return { ...c, tipo: 'produto' };
    });

    // Grupo primeiro, depois os produtos por volume — senão ele se perde entre 26 linhas.
    cliques.sort((a, b) => {
      if (a.tipo !== b.tipo) return a.tipo === 'grupo' ? -1 : 1;
      return (b.total || 0) - (a.total || 0);
    });

    corpo.cliques = cliques;
    corpo.grupo = grupo
      ? { total: grupo.total, origem: grupo.origem || {}, dias: grupo.dias || {} }
      : { total: 0, origem: {}, dias: {} };

    return res.end(JSON.stringify(corpo));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({
      erro: 'não consegui falar com a VPS agora',
      detalhe: String((e && e.message) || e),
    }));
  }
}
