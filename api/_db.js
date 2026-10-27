// Conexão com o Postgres (Neon). Só o servidor usa isso.
import pg from 'pg';

let _pool = null;
let _queryDeTeste = null;

/** Usado só pelos testes locais (PGlite) para injetar outro executor de SQL. */
export function usarQueryDeTeste(fn) { _queryDeTeste = fn; }

/** Aceita qualquer nome que a integração da Vercel costuma injetar. */
export function urlDoBanco() {
  return process.env.DATABASE_URL
    || process.env.POSTGRES_URL
    || process.env.NEON_DATABASE_URL
    || process.env.POSTGRES_URL_NON_POOLING
    || '';
}

export function pegarPool() {
  if (_pool) return _pool;
  const url = urlDoBanco();
  if (!url) throw new Error('DATABASE_URL ausente');
  _pool = new pg.Pool({
    connectionString: url,
    max: 1,                       // serverless: poucas conexões por instância
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 15000 // cold start do Neon
  });
  return _pool;
}

export async function q(text, params) {
  if (_queryDeTeste) return _queryDeTeste(text, params);
  return pegarPool().query(text, params);
}
