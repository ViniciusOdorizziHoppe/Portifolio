// GET/POST /api/ez-progresso → sincroniza o progresso do aluno
import { q } from './_db.js';
import { json, corpo, metodoPermitido, exigirAcesso } from './_ez.js';
import { lerProgresso, salvarProgresso } from './_ez-dominio.js';

const LIMITE = 48 * 1024; // 48 KB de progresso é folgado

export default async function handler(req, res) {
  if (!metodoPermitido(req, res, ['GET', 'POST'])) return;
  const conta = await exigirAcesso(req, res);
  if (!conta) return;

  if (req.method === 'GET') {
    const dados = await lerProgresso(q, conta.id);
    return json(res, 200, { ok: true, dados: dados || null });
  }

  let b;
  try { b = await corpo(req); } catch { return json(res, 400, { erro: 'corpo' }); }
  const dados = b.dados;
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    return json(res, 400, { erro: 'dados' });
  }
  if (JSON.stringify(dados).length > LIMITE) return json(res, 413, { erro: 'grande' });

  await salvarProgresso(q, conta.id, dados);
  return json(res, 200, { ok: true });
}
