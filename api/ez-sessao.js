// GET /api/ez-sessao → o app pergunta se pode abrir
import { json, metodoPermitido, sessaoAtual } from './_ez.js';
import { acessoLiberado } from './_ez-dominio.js';

export default async function handler(req, res) {
  if (!metodoPermitido(req, res, ['GET'])) return;
  try {
    const conta = await sessaoAtual(req);
    if (!conta) return json(res, 401, { ok: false, liberado: false, motivo: 'sem_sessao' });
    return json(res, 200, {
      ok: true,
      liberado: acessoLiberado(conta),
      motivo: acessoLiberado(conta) ? null : 'sem_assinatura',
      nome: conta.nome,
      email: conta.email,
      status: conta.status || 'inativo',
      plano: conta.plano || null,
      acessoAte: conta.acesso_ate || null
    });
  } catch (e) {
    console.error('ez-sessao', e);
    return json(res, 500, { ok: false, liberado: false, motivo: 'erro' });
  }
}
