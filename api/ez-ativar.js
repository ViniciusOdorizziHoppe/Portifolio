// POST /api/ez-ativar → primeiro acesso de quem comprou (conta criada pelo webhook)
import { q } from './_db.js';
import { json, corpo, cookieSessao, metodoPermitido, ehHttps } from './_ez.js';
import { definirSenha, emailLimpo, abrirSessao, acessoLiberado } from './_ez-dominio.js';
import { hashSenha, senhaForte } from './_auth.js';

export default async function handler(req, res) {
  if (!metodoPermitido(req, res, ['POST'])) return;

  let b;
  try { b = await corpo(req); } catch { return json(res, 400, { erro: 'corpo' }); }

  const email = emailLimpo(b.email);
  const senha = String(b.senha || '');
  if (!email) return json(res, 400, { erro: 'email' });
  if (!senhaForte(senha)) {
    return json(res, 400, { erro: 'senha_curta', mensagem: 'A senha precisa de 6 caracteres ou mais.' });
  }

  const r = await definirSenha(q, { email, senhaHash: hashSenha(senha) });

  if (r.erro === 'nao_encontrada') {
    return json(res, 404, { erro: 'nao_encontrada',
      mensagem: 'Não encontramos compra com esse e-mail. Use o mesmo e-mail da compra.' });
  }
  if (r.erro === 'ja_ativada') {
    return json(res, 409, { erro: 'ja_ativada', mensagem: 'Essa conta já tem senha. Use Entrar.' });
  }

  const sessao = await abrirSessao(q, r.conta.id);
  return json(res, 200, {
    ok: true, email: r.conta.email, nome: r.conta.nome,
    liberado: acessoLiberado(r.conta), acessoAte: r.conta.acesso_ate
  }, { 'Set-Cookie': cookieSessao(sessao.token, sessao.expira, ehHttps(req)) });
}
