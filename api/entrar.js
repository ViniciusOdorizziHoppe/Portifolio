// POST /api/entrar  → login
import { q } from './_db.js';
import { contaPorEmail } from './_dominio.js';
import { json, corpo, emailLimpo, confereSenha, abrirSessao, cookieSessao } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { erro: 'metodo' });

  const b = await corpo(req);
  const email = emailLimpo(b.email);
  const senha = b.senha;
  if (!email || !senha) return json(res, 400, { erro: 'campos' });

  const conta = await contaPorEmail(q, email);
  if (!conta || !conta.senha_hash || !confereSenha(senha, conta.senha_hash)) {
    return json(res, 401, { erro: 'credenciais', mensagem: 'E-mail ou senha não conferem.' });
  }
  if (conta.status !== 'ativo') {
    return json(res, 403, { erro: 'inativa', mensagem: 'Essa assinatura está cancelada.' });
  }
  if (conta.acesso_ate && new Date(conta.acesso_ate).getTime() < Date.now()) {
    return json(res, 403, { erro: 'expirada', mensagem: 'Sua assinatura venceu. Renove para continuar.' });
  }

  const sessao = await abrirSessao(conta.id);
  return json(res, 200, {
    ok: true,
    email: conta.email,
    nome: conta.nome,
    acessoAte: conta.acesso_ate
  }, { 'Set-Cookie': cookieSessao(sessao.token, sessao.expira) });
}
