// Aplica o schema da Caderneta no Neon.
// Migração usa conexão DIRETA (sem pooler), conforme a skill neon-postgres.
//   node tests/migrar-neon.mjs
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { carregarEnvLocal } from './env-local.mjs';

const n = carregarEnvLocal();
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('Sem DATABASE_URL. Rode `neon deploy` antes.');
  process.exit(1);
}
const mascarada = url.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@');
console.log('env carregado de .env.local:', n, 'chaves');
console.log('conexao:', mascarada.split('?')[0]);
console.log('pooler:', /-pooler/.test(url) ? 'sim' : 'nao (direta, correta para migracao)');

const cliente = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20000 });
await cliente.connect();

const sql = readFileSync(new URL('../sql/caderneta-acesso.sql', import.meta.url), 'utf8');
await cliente.query(sql);
console.log('schema aplicado');

const t = await cliente.query(
  `select table_name from information_schema.tables
    where table_schema = 'public' order by table_name`
);
console.log('tabelas:', t.rows.map((r) => r.table_name).join(', '));

const cols = await cliente.query(
  `select column_name, data_type from information_schema.columns
    where table_name = 'contas' order by ordinal_position`
);
console.log('contas:', cols.rows.map((r) => r.column_name + ':' + r.data_type).join(' | '));

await cliente.end();
console.log('OK');
