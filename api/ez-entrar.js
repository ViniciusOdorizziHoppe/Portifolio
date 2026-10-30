// POST /api/ez-entrar → login com freio de força bruta
import { q } from './_db.js';
import { json, corpo, cookieSessao, metodoPermitido, chaveTentativa, ehHttps } from './_ez.js';
import { contaPorEmail, emailLimpo, abrirSessao, acessoLiberado,
         tentativasRestantes, registrarFalha, limparFalhas } from './_ez-dominio.js';
import { confereSenha } from './_auth.js';

export default async function handler(req, res) {
  if (!metodoPermitido(req, res, ['POST'])) return;

  let b;
  try { b = await corpo(req); } catch { return json(res, 400, { erro: 'corpo' }); }

  const email = emailLimpo(b.email);
  const senha = String(b.senha || '');
  if (!email || !senha) return json(res, 400, { erro: 'campos', mensagem: 'Preencha e-mail e senha.' });

  const chave = chaveTentativa(req, email);
  const freio = await tentativasRestantes(q, chave);
  if (freio.bloqueado) {
    return json(res, 429, { erro: 'bloqueado', mensagem: 'Muitas tentativas. Tente de novo em 15 minutos.' });
  }

  const conta = await contaPorEmail(q, email);
  if (!conta || !conta.senha_hash || !confereSenha(senha, conta.senha_hash)) {
    await registrarFalha(q, chave);
    // mensagem genérica: não revela se o e-mail existe
    return json(res, 401, { erro: 'credenciais', mensagem: 'E-mail ou senha não conferem.' });
  }

  await limparFalhas(q, chave);
  const sessao = await abrirSessao(q, conta.id);
  return json(res, 200, {
    ok: true,
    email: conta.email,
    nome: conta.nome,
    liberado: acessoLiberado(conta),
    status: conta.status || 'inativo',
    acessoAte: conta.acesso_ate || null
  }, { 'Set-Cookie': cookieSessao(sessao.token, sessao.expira, ehHttps(req)) });
}
