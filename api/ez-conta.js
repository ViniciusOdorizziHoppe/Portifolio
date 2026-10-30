// DELETE /api/ez-conta → apaga a conta e tudo dela (LGPD)
import { q } from './_db.js';
import { json, metodoPermitido, sessaoAtual, cookieLimpo, ehHttps } from './_ez.js';

export default async function handler(req, res) {
  if (!metodoPermitido(req, res, ['DELETE'])) return;
  const conta = await sessaoAtual(req);
  if (!conta) return json(res, 401, { ok: false, motivo: 'sem_sessao' });

  // on delete cascade limpa sessões, acesso e progresso
  await q('delete from ez_contas where id = $1', [conta.id]);
  return json(res, 200, { ok: true }, { 'Set-Cookie': cookieLimpo(ehHttps(req)) });
}
