// POST /api/ativar  → primeiro acesso: define a senha da conta criada pelo webhook
import { q } from './_db.js';
import { ativarConta } from './_dominio.js';
import { json, corpo, emailLimpo, hashSenha, senhaForte, abrirSessao, cookieSessao } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { erro: 'metodo' });

  const b = await corpo(req);
  const email = emailLimpo(b.email);
  const senha = b.senha;

  if (!email || email.indexOf('@') < 1) return json(res, 400, { erro: 'email' });
  if (!senhaForte(senha)) return json(res, 400, { erro: 'senha_curta' });

  const r = await ativarConta(q, { email, senhaHash: hashSenha(senha) });

  if (r.erro === 'nao_encontrada') {
    return json(res, 404, {
      erro: 'nao_encontrada',
      mensagem: 'Não encontramos nenhuma compra com esse e-mail. Use o mesmo e-mail da compra na Hotmart.'
    });
  }
  if (r.erro === 'ja_ativada') {
    return json(res, 409, { erro: 'ja_ativada', mensagem: 'Essa conta já tem senha. Use a opção Entrar.' });
  }
  if (r.erro === 'inativa' || r.erro === 'expirada') {
    return json(res, 403, { erro: r.erro, mensagem: 'A assinatura dessa conta não está ativa.' });
  }

  const sessao = await abrirSessao(r.conta.id);
  return json(res, 200, {
    ok: true,
    email: r.conta.email,
    nome: r.conta.nome,
    acessoAte: r.conta.acesso_ate
  }, { 'Set-Cookie': cookieSessao(sessao.token, sessao.expira) });
}
