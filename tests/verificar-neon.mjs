// Prova final: consulta o banco de verdade e limpa os dados de teste.
import pg from 'pg';
import { carregarEnvLocal } from './env-local.mjs';

carregarEnvLocal();
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const c = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20000 });
await c.connect();

const antes = await c.query(`
  select (select count(*) from contas)   as contas,
         (select count(*) from sessoes)  as sessoes,
         (select count(*) from eventos)  as eventos
`);
console.log('ANTES  contas=%s sessoes=%s eventos=%s',
  antes.rows[0].contas, antes.rows[0].sessoes, antes.rows[0].eventos);

const lista = await c.query(`
  select email, status, plano, to_char(acesso_ate, 'YYYY-MM-DD') as acesso_ate,
         (senha_hash is not null) as tem_senha
    from contas order by id
`);
for (const r of lista.rows) {
  console.log('  conta:', r.email, '|', r.status, '|', r.plano, '| acesso ate', r.acesso_ate, '| senha:', r.tem_senha);
}

const ev = await c.query(`select id, tipo from eventos order by recebido_em`);
console.log('  eventos:', ev.rows.map((r) => r.tipo + '(' + r.id.split(':')[1] + ')').join(', '));

await c.query(`delete from sessoes`);
await c.query(`delete from eventos`);
await c.query(`delete from contas`);

const depois = await c.query(`
  select (select count(*) from contas) as contas,
         (select count(*) from sessoes) as sessoes,
         (select count(*) from eventos) as eventos
`);
console.log('DEPOIS contas=%s sessoes=%s eventos=%s (banco limpo para o lancamento)',
  depois.rows[0].contas, depois.rows[0].sessoes, depois.rows[0].eventos);

const tab = await c.query(`select table_name from information_schema.tables where table_schema='public' order by 1`);
console.log('tabelas no Neon:', tab.rows.map((r) => r.table_name).join(', '));

await c.end();
