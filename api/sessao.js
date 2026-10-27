// GET /api/sessao  → o app pergunta se pode abrir
import { contaDaRequisicao, json } from './_auth.js';
import { urlDoBanco } from './_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return json(res, 405, { erro: 'metodo' });

  // Banco ainda não configurado: 404 faz o app seguir aberto em vez de trancar todo mundo
  if (!urlDoBanco()) {
    return json(res, 404, { ok: false, liberado: false, motivo: 'nao_configurado' });
  }

  try {
    const conta = await contaDaRequisicao(req);
    if (!conta) return json(res, 401, { ok: false, liberado: false, motivo: 'sem_sessao' });
    if (!conta.liberado) {
      return json(res, 403, {
        ok: false,
        liberado: false,
        motivo: conta.motivo,
        email: conta.email,
        acessoAte: conta.acesso_ate
      });
    }
    return json(res, 200, {
      ok: true,
      liberado: true,
      email: conta.email,
      nome: conta.nome,
      plano: conta.plano,
      acessoAte: conta.acesso_ate
    });
  } catch (e) {
    console.error('sessao falhou', e);
    return json(res, 500, { ok: false, liberado: false, motivo: 'erro' });
  }
}
