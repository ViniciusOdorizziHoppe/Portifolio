// Aplica o schema do Enemzeiro no Postgres do Neon.
//   node tests/aplicar-schema-enemzeiro.mjs
import { readFileSync } from 'node:fs';
import pg from 'pg';

function carregarEnv() {
  const txt = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const linha of txt.split(/\r?\n/)) {
    const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

carregarEnv();
const url = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
if (!url) { console.error('DATABASE_URL ausente'); process.exit(1); }

const sql = readFileSync(new URL('../sql/enemzeiro.sql', import.meta.url), 'utf8');
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();
try {
  await c.query(sql);
  const r = await c.query(
    `select table_name from information_schema.tables
      where table_schema = 'public' and table_name like 'ez_%' order by 1`
  );
  console.log('tabelas criadas:', r.rows.map((x) => x.table_name).join(', '));
  const n = await c.query('select count(*)::int as n from ez_contas');
  console.log('contas hoje:', n.rows[0].n);
} finally {
  await c.end();
}
