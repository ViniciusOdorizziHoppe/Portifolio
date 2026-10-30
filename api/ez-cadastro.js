// POST /api/ez-cadastro → cria conta (com trial opcional) e já abre sessão
import { q } from './_db.js';
import { json, corpo, cookieSessao, metodoPermitido, ehHttps } from './_ez.js';
import { criarConta, emailLimpo, nomeLimpo, telefoneLimpo, abrirSessao, acessoLiberado } from './_ez-dominio.js';
import { hashSenha, senhaForte } from './_auth.js';

export default async function handler(req, res) {
  if (!metodoPermitido(req, res, ['POST'])) return;

  let b;
  try { b = await corpo(req); } catch { return json(res, 400, { erro: 'corpo' }); }

  const email = emailLimpo(b.email);
  const nome = nomeLimpo(b.nome);
  const telefone = telefoneLimpo(b.telefone);
  const senha = String(b.senha || '');

  if (!email) return json(res, 400, { erro: 'email_invalido', mensagem: 'Confira o e-mail.' });
  if (nome.split(' ').filter(Boolean).length < 2) {
    return json(res, 400, { erro: 'nome', mensagem: 'Digite seu nome completo.' });
  }
  if (!senhaForte(senha)) {
    return json(res, 400, { erro: 'senha_curta', mensagem: 'A senha precisa de 6 caracteres ou mais.' });
  }

  // padrão: 7 dias de teste. EZ_TRIAL_DIAS=0 desliga o teste grátis.
  const trial = Number(process.env.EZ_TRIAL_DIAS ?? 7);
  const r = await criarConta(q, { email, nome, telefone, senhaHash: hashSenha(senha), trialDias: trial });

  if (r.erro === 'ja_existe') {
    return json(res, 409, { erro: 'ja_existe', mensagem: 'Esse e-mail já tem conta. Faça login.' });
  }
  if (r.erro) return json(res, 400, { erro: r.erro });

  const sessao = await abrirSessao(q, r.conta.id);
  return json(res, 200, {
    ok: true,
    email: r.conta.email,
    nome: r.conta.nome,
    liberado: acessoLiberado(r.conta),
    acessoAte: r.conta.acesso_ate
  }, { 'Set-Cookie': cookieSessao(sessao.token, sessao.expira, ehHttps(req)) });
}
