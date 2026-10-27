// Teste real do controle de acesso da Caderneta.
// Roda o MESMO SQL que roda no Neon, usando Postgres em WASM (PGlite).
//   node tests/caderneta-acesso.test.mjs
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import {
  aplicarEvento, ativarConta, contaPorEmail, liberarAcesso, revogarAcesso
} from '../api/_dominio.js';
import { hashSenha, confereSenha } from '../api/_auth.js';

let falhas = 0;
let passes = 0;
function ok(nome, cond, extra) {
  if (cond) { passes++; console.log('  ok   ' + nome); }
  else { falhas++; console.log('  FALHA ' + nome + (extra ? ' -> ' + extra : '')); }
}
function pertoDe(data, meses, toleranciaDias) {
  const alvo = new Date(data).getTime();
  const esperado = Date.now() + meses * 30.44 * 86400000;
  return Math.abs(alvo - esperado) <= toleranciaDias * 86400000;
}

const db = new PGlite();
await db.exec(readFileSync(new URL('../sql/caderneta-acesso.sql', import.meta.url), 'utf8'));

// mesma assinatura de q() de produção (pg devolve rowCount)
const q = async (text, params) => {
  const r = await db.query(text, params);
  return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length };
};

const email = 'lojista@teste.com.br';

console.log('\n1. compra aprovada cria a conta liberada');
const r1 = await aplicarEvento(q, {
  evento: 'PURCHASE_APPROVED', email, nome: 'Maria Lojista',
  transacao: 'HP111', valor: 597, planoNome: 'Caderneta Anual', original: {}
});
ok('acao = liberado', r1.acao === 'liberado', JSON.stringify(r1));
const c1 = await contaPorEmail(q, email);
ok('conta existe', !!c1);
ok('status ativo', c1.status === 'ativo', c1.status);
ok('plano anual', c1.plano === 'anual', c1.plano);
ok('acesso ~12 meses', pertoDe(c1.acesso_ate, 12, 3), c1.acesso_ate);
ok('sem senha ainda', c1.senha_hash === null);

console.log('\n2. o mesmo evento de novo nao estende o acesso (idempotencia)');
const r2 = await aplicarEvento(q, {
  evento: 'PURCHASE_APPROVED', email, transacao: 'HP111', valor: 597, planoNome: 'Caderneta Anual', original: {}
});
ok('acao = repetido', r2.acao === 'repetido', JSON.stringify(r2));
const c2 = await contaPorEmail(q, email);
ok('acesso nao mudou', String(c2.acesso_ate) === String(c1.acesso_ate), String(c2.acesso_ate));

console.log('\n3. renovacao no ano seguinte soma 12 meses');
const r3 = await aplicarEvento(q, {
  evento: 'PURCHASE_APPROVED', email, transacao: 'HP222', valor: 597, planoNome: 'Caderneta Anual', original: {}
});
ok('acao = liberado', r3.acao === 'liberado');
const c3 = await contaPorEmail(q, email);
ok('acesso ~24 meses', pertoDe(c3.acesso_ate, 24, 4), c3.acesso_ate);

console.log('\n4. primeiro acesso define a senha');
const hash = hashSenha('senha123');
const a1 = await ativarConta(q, { email, senhaHash: hash });
ok('ativou', !!a1.conta, JSON.stringify(a1));
const c4 = await contaPorEmail(q, email);
ok('senha guardada', !!c4.senha_hash);
ok('senha confere', confereSenha('senha123', c4.senha_hash));
ok('senha errada nao confere', !confereSenha('senha124', c4.senha_hash));

console.log('\n5. ativar de novo e recusado (usa Entrar)');
const a2 = await ativarConta(q, { email, senhaHash: hashSenha('outra123') });
ok('erro ja_ativada', a2.erro === 'ja_ativada', JSON.stringify(a2));

console.log('\n6. e-mail sem compra nao ativa');
const a3 = await ativarConta(q, { email: 'naocomprei@x.com', senhaHash: hashSenha('senha123') });
ok('erro nao_encontrada', a3.erro === 'nao_encontrada', JSON.stringify(a3));

console.log('\n7. reembolso revoga na hora');
const r7 = await aplicarEvento(q, {
  evento: 'PURCHASE_REFUNDED', email, transacao: 'HP111', valor: 597, original: {}
});
ok('acao = reembolsado', r7.acao === 'reembolsado', JSON.stringify(r7));
const c7 = await contaPorEmail(q, email);
ok('status reembolsado', c7.status === 'reembolsado', c7.status);
ok('acesso_ate no passado', new Date(c7.acesso_ate).getTime() <= Date.now() + 1000, c7.acesso_ate);

console.log('\n8. cancelamento mantem o acesso ate o fim do periodo pago');
const e8 = 'cancelou@teste.com.br';
await liberarAcesso(q, { email: e8, nome: 'Juca', plano: 'anual', meses: 12, codigo: 'HP333' });
const antes = (await contaPorEmail(q, e8)).acesso_ate;
const r8 = await aplicarEvento(q, { evento: 'SUBSCRIPTION_CANCELLATION', email: e8, transacao: 'HP333', original: {} });
ok('acao = cancelado', r8.acao === 'cancelado', JSON.stringify(r8));
const c8 = await contaPorEmail(q, e8);
ok('status cancelado', c8.status === 'cancelado', c8.status);
ok('acesso preservado', String(c8.acesso_ate) === String(antes), String(c8.acesso_ate));

console.log('\n9. plano mensal (venda recuperada) libera 1 mes');
const e9 = 'recuperado@teste.com.br';
await aplicarEvento(q, {
  evento: 'PURCHASE_APPROVED', email: e9, transacao: 'HP444', valor: 49.75,
  planoNome: 'Caderneta Mensal', original: {}
});
const c9 = await contaPorEmail(q, e9);
ok('plano mensal', c9.plano === 'mensal', c9.plano);
ok('acesso ~1 mes', pertoDe(c9.acesso_ate, 1, 2), c9.acesso_ate);

console.log('\n10. evento sem e-mail e ignorado sem quebrar');
const r10 = await aplicarEvento(q, { evento: 'PURCHASE_APPROVED', email: '', transacao: 'HP999', original: {} });
ok('acao = ignorado', r10.acao === 'ignorado', JSON.stringify(r10));

console.log('\n11. revogar e-mail inexistente nao explode');
const r11 = await revogarAcesso(q, { email: 'fantasma@x.com', status: 'cancelado' });
ok('retorna null', r11 === null, JSON.stringify(r11));

console.log('\n----------------------------------------');
console.log(falhas === 0 ? 'TODOS OS ' + passes + ' TESTES PASSARAM' : falhas + ' FALHARAM de ' + (passes + falhas));
process.exit(falhas === 0 ? 0 : 1);
