// Todas as rotas do Enemzeiro em um só módulo.
// Motivo: o plano Hobby da Vercel aceita no máximo 12 Serverless Functions por deploy,
// então api/ez/[...rota].js chama daqui em vez de um arquivo por rota.
import { q } from './_db.js';
import {
  json, corpo, metodoPermitido, cookieSessao, cookieLimpo, ehHttps, sessaoAtual,
  exigirAcesso, chaveTentativa, leCookie, COOKIE
} from './_ez.js';
import {
  criarConta, definirSenha, contaPorEmail, abrirSessao, fecharSessao, emailLimpo, nomeLimpo,
  telefoneLimpo, acessoLiberado, tentativasRestantes, registrarFalha, limparFalhas,
  lerProgresso, salvarProgresso
} from './_ez-dominio.js';
import { hashSenha, confereSenha, senhaForte } from './_auth.js';
import * as dominio from './_ez-dominio.js';
import { origemConfiavel, aplicarEvento } from './_ez-webhooks.js';

/* ------------------------------------------------------------------ contas */

export async function cadastro(req, res) {
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
    ok: true, email: r.conta.email, nome: r.conta.nome,
    liberado: acessoLiberado(r.conta), acessoAte: r.conta.acesso_ate
  }, { 'Set-Cookie': cookieSessao(sessao.token, sessao.expira, ehHttps(req)) });
}

export async function entrar(req, res) {
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
    return json(res, 401, { erro: 'credenciais', mensagem: 'E-mail ou senha não conferem.' });
  }

  await limparFalhas(q, chave);
  const sessao = await abrirSessao(q, conta.id);
  return json(res, 200, {
    ok: true, email: conta.email, nome: conta.nome,
    liberado: acessoLiberado(conta), status: conta.status || 'inativo',
    acessoAte: conta.acesso_ate || null
  }, { 'Set-Cookie': cookieSessao(sessao.token, sessao.expira, ehHttps(req)) });
}

export async function ativar(req, res) {
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

export async function sair(req, res) {
  if (!metodoPermitido(req, res, ['POST'])) return;
  try { await fecharSessao(q, leCookie(req, COOKIE)); } catch { /* segue */ }
  return json(res, 200, { ok: true }, { 'Set-Cookie': cookieLimpo(ehHttps(req)) });
}

export async function sessao(req, res) {
  if (!metodoPermitido(req, res, ['GET'])) return;
  try {
    const conta = await sessaoAtual(req);
    if (!conta) return json(res, 401, { ok: false, liberado: false, motivo: 'sem_sessao' });
    const liberado = acessoLiberado(conta);
    return json(res, 200, {
      ok: true, liberado, motivo: liberado ? null : 'sem_assinatura',
      nome: conta.nome, email: conta.email, status: conta.status || 'inativo',
      plano: conta.plano || null, acessoAte: conta.acesso_ate || null
    });
  } catch (e) {
    console.error('ez-sessao', e);
    return json(res, 500, { ok: false, liberado: false, motivo: 'erro' });
  }
}

export async function progresso(req, res) {
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
  if (JSON.stringify(dados).length > 48 * 1024) return json(res, 413, { erro: 'grande' });

  await salvarProgresso(q, conta.id, dados);
  return json(res, 200, { ok: true });
}

export async function conta(req, res) {
  if (!metodoPermitido(req, res, ['DELETE'])) return;
  const c = await sessaoAtual(req);
  if (!c) return json(res, 401, { ok: false, motivo: 'sem_sessao' });
  await q('delete from ez_contas where id = $1', [c.id]);
  return json(res, 200, { ok: true }, { 'Set-Cookie': cookieLimpo(ehHttps(req)) });
}

/* ---------------------------------------------------------------- webhooks */

export async function webhook(req, res, plataforma) {
  if (!metodoPermitido(req, res, ['POST'])) return;

  let cru = '';
  try {
    const { corpoCru } = await import('./_ez.js');
    cru = await corpoCru(req);
  } catch { return json(res, 413, { erro: 'corpo_grande' }); }

  if (!origemConfiavel(plataforma, req, cru)) {
    return json(res, 401, { ok: false, erro: 'origem_nao_confiavel' });
  }

  let body;
  try { body = JSON.parse(cru); }
  catch { body = Object.fromEntries(new URLSearchParams(cru).entries()); }

  try {
    const r = await aplicarEvento(q, dominio, { plataforma, body, cru });
    return json(res, r.ok ? 200 : 422, r);
  } catch (e) {
    console.error('webhook falhou', plataforma, e);
    return json(res, 500, { ok: false, erro: 'processamento' });
  }
}
