// Grava/atualiza a configuração do painel de vendas no Postgres (Neon).
//   node tests/gravar-config.mjs HOTMART_CLIENT_ID=xxx HOTMART_CLIENT_SECRET=yyy HOTMART_DASH_KEY=zzz
// Usa a conexão DIRETA (DATABASE_URL_UNPOOLED) para migração.
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { carregarEnvLocal } from './env-local.mjs';

carregarEnvLocal();

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('Sem DATABASE_URL. Configure o .env.local antes.');
  process.exit(1);
}

const pares = process.argv.slice(2).filter((a) => a.includes('='));
if (!pares.length) {
  console.error('Nada para gravar. Passe CHAVE=valor.');
  process.exit(1);
}

const cliente = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20000 });
await cliente.connect();

await cliente.query(readFileSync(new URL('../sql/dashboard-config.sql', import.meta.url), 'utf8'));
console.log('tabela dashboard_config pronta');

for (const par of pares) {
  const i = par.indexOf('=');
  const chave = par.slice(0, i).trim();
  const valor = par.slice(i + 1);
  await cliente.query(
    `insert into dashboard_config (chave, valor, atualizado_em)
     values ($1, $2, now())
     on conflict (chave) do update set valor = excluded.valor, atualizado_em = now()`,
    [chave, valor]
  );
  console.log('gravado:', chave, '(' + valor.length + ' caracteres)');
}

const r = await cliente.query('select chave, length(valor) as tam from dashboard_config order by chave');
console.log('no banco agora:', r.rows.map((l) => l.chave + '=' + l.tam).join(', '));

await cliente.end();
