// Teste real da conta/acesso do Enemzeiro.
// Roda o MESMO SQL que roda no Neon, usando Postgres em WASM (PGlite).
//   node tests/enemzeiro.test.mjs
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import * as dominio from '../api/_ez-dominio.js';
import { aplicarEvento, origemConfiavel, classificar, extrair } from '../api/_ez-webhooks.js';
import { hashSenha, confereSenha } from '../api/_auth.js';

let falhas = 0, passes = 0;
const ok = (nome, cond, extra) => {
  if (cond) { passes++; console.log('  ok   ' + nome); }
  else { falhas++; console.log('  FALHA ' + nome + (extra ? ' -> ' + extra : '')); }
};
const pertoDe = (data, meses, tolDias) => {
  const alvo = new Date(data).getTime();
  const esperado = Date.now() + meses * 30.44 * 86400000;
  return Math.abs(alvo - esperado) <= tolDias * 86400000;
};

const db = new PGlite();
await db.exec(readFileSync(new URL('../sql/enemzeiro.sql', import.meta.url), 'utf8'));

const q = async (text, params) => {
  const r = await db.query(text, params);
  return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length };
};

/* ---------------------------------------------------------------- webhook */

console.log('\n1. compra aprovada libera acesso');
const ev = (event, extra = {}) => ({
  event,
  data: {
    buyer: { email: 'aluno@teste.com', name: 'Ana Aluna' },
    purchase: { transaction: 'HP999', price: { value: 358 }, offer: { name: 'Enemzeiro Anual' } },
    ...extra
  }
});

const r1 = await aplicarEvento(q, dominio, {
  plataforma: 'hotmart', body: ev('PURCHASE_APPROVED'), cru: 'a'
});
ok('acao = liberado', r1.acao === 'liberado', JSON.stringify(r1));

const c1 = await dominio.contaPorEmail(q, 'aluno@teste.com');
ok('conta criada sem senha', !!c1 && !c1.senha_hash);
ok('status ativo', c1.status === 'ativo', c1.status);
ok('acesso ~12 meses', pertoDe(c1.acesso_ate, 12, 3), c1.acesso_ate);
ok('acesso liberado', dominio.acessoLiberado(c1));

console.log('\n2. evento repetido não renova de novo');
const antes = c1.acesso_ate;
const r2 = await aplicarEvento(q, dominio, {
  plataforma: 'hotmart', body: ev('PURCHASE_APPROVED'), cru: 'a'
});
const c2 = await dominio.contaPorEmail(q, 'aluno@teste.com');
ok('acao = duplicado', r2.acao === 'duplicado', JSON.stringify(r2));
ok('acesso_ate não mudou', String(antes) === String(c2.acesso_ate));

console.log('\n3. reembolso corta na hora');
await aplicarEvento(q, dominio, {
  plataforma: 'hotmart',
  body: { event: 'PURCHASE_REFUNDED', data: { buyer: { email: 'aluno@teste.com' }, purchase: { transaction: 'HP999' } } },
  cru: 'b'
});
const c3 = await dominio.contaPorEmail(q, 'aluno@teste.com');
ok('status reembolsado', c3.status === 'reembolsado', c3.status);
ok('sem acesso', !dominio.acessoLiberado(c3));

console.log('\n4. cancelamento mantém o período pago');
await aplicarEvento(q, dominio, {
  plataforma: 'kiwify',
  body: { order_status: 'paid', Customer: { email: 'bia@teste.com', name: 'Bia' }, order_id: 'KW1' },
  cru: 'c'
});
await aplicarEvento(q, dominio, {
  plataforma: 'kiwify',
  body: { order_status: 'subscription_canceled', Customer: { email: 'bia@teste.com' }, order_id: 'KW1x' },
  cru: 'd'
});
const c4 = await dominio.contaPorEmail(q, 'bia@teste.com');
ok('status cancelado', c4.status === 'cancelado', c4.status);
ok('ainda usa até vencer', dominio.acessoLiberado(c4));

console.log('\n5. payload sem e-mail é recusado');
const r5 = await aplicarEvento(q, dominio, {
  plataforma: 'eduzz', body: { event: 'purchase_approved', data: { nada: 1 } }, cru: 'e'
});
ok('ok = false', r5.ok === false, JSON.stringify(r5));
ok('erro email_ausente', r5.erro === 'email_ausente', r5.erro);

/* ------------------------------------------------------------- assinatura */

console.log('\n6. verificação de origem do webhook');
process.env.EZ_WEBHOOK_MONETIZZE_TOKEN = 'segredo-123';
ok('sem token -> recusa', origemConfiavel('monetizze', { url: '/api/ez-webhook-monetizze', headers: {} }, 'x') === false);
ok('token errado -> recusa', origemConfiavel('monetizze', { url: '/api/ez-webhook-monetizze?t=errado', headers: {} }, 'x') === false);
ok('token certo -> aceita', origemConfiavel('monetizze', { url: '/api/ez-webhook-monetizze?t=segredo-123', headers: {} }, 'x') === true);
delete process.env.EZ_WEBHOOK_MONETIZZE_TOKEN;

const crypto = await import('node:crypto');
process.env.EZ_WEBHOOK_KIRVANO_SECRET = 'hmac-abc';
const corpoTeste = '{"a":1}';
const assinatura = crypto.createHmac('sha256', 'hmac-abc').update(corpoTeste).digest('hex');
ok('hmac certo -> aceita',
  origemConfiavel('kirvano', { url: '/api/ez-webhook-kirvano', headers: { 'x-webhook-signature': assinatura } }, corpoTeste) === true);
ok('hmac errado -> recusa',
  origemConfiavel('kirvano', { url: '/api/ez-webhook-kirvano', headers: { 'x-webhook-signature': 'deadbeef' } }, corpoTeste) === false);
delete process.env.EZ_WEBHOOK_KIRVANO_SECRET;
ok('sem segredo configurado -> recusa (fail closed)',
  origemConfiavel('kirvano', { url: '/api/ez-webhook-kirvano?t=x', headers: {} }, 'y') === false);

console.log('\n7. classificação de status');
ok('PURCHASE_APPROVED -> liberar', classificar('PURCHASE_APPROVED') === 'liberar');
ok('paid -> liberar', classificar('paid') === 'liberar');
ok('chargeback -> reembolsado', classificar('chargeback') === 'reembolsado');
ok('subscription_canceled -> cancelado', classificar('subscription_canceled') === 'cancelado');
ok('waiting_payment -> ignorar', classificar('waiting_payment') === 'ignorar');

console.log('\n8. extração de campos em payloads diferentes');
const exHotmart = extrair({ data: { buyer: { email: 'a@b.com', name: 'A' }, purchase: { price: { value: 29.9 }, offer: { name: 'Mensal' } } } });
ok('hotmart email', exHotmart.email === 'a@b.com', exHotmart.email);
ok('hotmart valor', exHotmart.valor === 29.9, exHotmart.valor);
const exKiwify = extrair({ Customer: { email: 'c@d.com', full_name: 'C' }, order_id: 'x' });
ok('kiwify email', exKiwify.email === 'c@d.com', exKiwify.email);
const exMonetizze = extrair({ email: 'e@f.com', valor: '358.00', produto: 'Enemzeiro' });
ok('monetizze email', exMonetizze.email === 'e@f.com', exMonetizze.email);
ok('monetizze valor', exMonetizze.valor === 358, exMonetizze.valor);

/* ------------------------------------------------------- cadastro e login */

console.log('\n9. cadastro com trial');
const r9 = await dominio.criarConta(q, {
  email: 'novo@teste.com', nome: 'Novo Aluno', telefone: '47999998888',
  senhaHash: hashSenha('senha123'), trialDias: 7
});
ok('conta criada', !!r9.conta, JSON.stringify(r9));
ok('liberado no trial', dominio.acessoLiberado(r9.conta));
ok('origem trial', r9.conta.origem === 'trial', r9.conta.origem);

const r9b = await dominio.criarConta(q, {
  email: 'novo@teste.com', nome: 'Outro', senhaHash: hashSenha('x123456'), trialDias: 7
});
ok('e-mail repetido recusado', r9b.erro === 'ja_existe', JSON.stringify(r9b));

console.log('\n10. conta de compra sem senha: primeiro acesso');
const r10 = await dominio.definirSenha(q, { email: 'aluno@teste.com', senhaHash: hashSenha('minhasenha') });
ok('senha definida', !!r10.conta, JSON.stringify(r10));
const r10b = await dominio.definirSenha(q, { email: 'aluno@teste.com', senhaHash: hashSenha('outra') });
ok('segunda ativação recusada', r10b.erro === 'ja_ativada', JSON.stringify(r10b));

const c10 = await dominio.contaPorEmail(q, 'aluno@teste.com');
ok('confere senha certa', confereSenha('minhasenha', c10.senha_hash));
ok('rejeita senha errada', !confereSenha('errada', c10.senha_hash));

console.log('\n11. freio de força bruta');
const chave = 'hash-de-teste';
for (let i = 0; i < 9; i++) await dominio.registrarFalha(q, chave);
let freio = await dominio.tentativasRestantes(q, chave);
ok('9 falhas ainda libera', freio.bloqueado === false, JSON.stringify(freio));
await dominio.registrarFalha(q, chave);
freio = await dominio.tentativasRestantes(q, chave);
ok('10ª falha bloqueia', freio.bloqueado === true, JSON.stringify(freio));
await dominio.limparFalhas(q, chave);
freio = await dominio.tentativasRestantes(q, chave);
ok('limpar libera de novo', freio.bloqueado === false);

console.log('\n12. sessão');
const s = await dominio.abrirSessao(q, c1.id);
const dono = await dominio.contaDaSessao(q, s.token);
ok('sessão encontra a conta', !!dono && dono.email === 'aluno@teste.com');
ok('token inventado não vale', (await dominio.contaDaSessao(q, 'abc123')) === null);
await q('update ez_sessoes set expira_em = now() - interval \'1 day\' where token = $1', [s.token]);
ok('sessão vencida não vale', (await dominio.contaDaSessao(q, s.token)) === null);
await dominio.fecharSessao(q, s.token);

console.log('\n13. progresso');
const conta = await dominio.contaPorEmail(q, 'novo@teste.com');
await dominio.salvarProgresso(q, conta.id, { xp: 120, streak: 4, stats: { matematica: { ok: 3, tot: 5 } } });
const lido = await dominio.lerProgresso(q, conta.id);
ok('salvou e leu', lido && lido.xp === 120 && lido.streak === 4, JSON.stringify(lido));
await dominio.salvarProgresso(q, conta.id, { xp: 200, streak: 5 });
const lido2 = await dominio.lerProgresso(q, conta.id);
ok('sobrescreve (não duplica)', lido2.xp === 200);

console.log('\n14. apagar conta limpa tudo (LGPD)');
const antesProgresso = await q('select count(*)::int as n from ez_progresso where conta_id = $1', [conta.id]);
await q('delete from ez_contas where id = $1', [conta.id]);
const depoisProgresso = await q('select count(*)::int as n from ez_progresso where conta_id = $1', [conta.id]);
const depoisSessoes = await q('select count(*)::int as n from ez_sessoes where conta_id = $1', [conta.id]);
ok('progresso apagado', antesProgresso.rows[0].n === 1 && depoisProgresso.rows[0].n === 0);
ok('sessões apagadas', depoisSessoes.rows[0].n === 0);

console.log('\n=======================================');
console.log(`${passes} passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
