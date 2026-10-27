// Servidor local da Caderneta: estáticos + /api com PGlite no lugar do Neon.
// Usado só para testar o fluxo real de acesso antes de publicar.
//   node tests/servidor-local.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { carregarEnvLocal } from './env-local.mjs';

const PORTA = 4399;
const RAIZ = fileURLToPath(new URL('../public/', import.meta.url));

// --neon: usa o banco de verdade (.env.local). Sem a flag, Postgres em WASM.
const USAR_NEON = process.argv.includes('--neon');

if (USAR_NEON) {
  const n = carregarEnvLocal();
  console.log('modo NEON · .env.local:', n, 'chaves · banco:',
    (process.env.DATABASE_URL || '').replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@').split('?')[0]);
} else {
  const db = new PGlite();
  await db.exec(readFileSync(new URL('../sql/caderneta-acesso.sql', import.meta.url), 'utf8'));
  const { usarQueryDeTeste } = await import('../api/_db.js');
  usarQueryDeTeste(async (text, params) => {
    const r = await db.query(text, params);
    return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length };
  });
}

process.env.HOTMART_HOTTOK = 'hottok-de-teste';

const rotas = {
  '/api/sessao': (await import('../api/sessao.js')).default,
  '/api/entrar': (await import('../api/entrar.js')).default,
  '/api/ativar': (await import('../api/ativar.js')).default,
  '/api/sair': (await import('../api/sair.js')).default,
  '/api/hotmart': (await import('../api/hotmart.js')).default
};

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function lerCorpo(req) {
  return new Promise((resolve) => {
    const partes = [];
    req.on('data', (c) => partes.push(c));
    req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
  });
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let caminho = url.pathname;

  if (caminho.startsWith('/api/')) {
    const rota = rotas[caminho];
    if (!rota) { res.statusCode = 404; return res.end('{"erro":"rota"}'); }
    if (req.method === 'POST') req.body = await lerCorpo(req);
    return rota(req, res);
  }

  if (caminho === '/caderneta' || caminho === '/caderneta/') {
    res.writeHead(302, { Location: '/caderneta/index.html' });
    return res.end();
  }

  const arquivo = join(RAIZ, caminho);
  try {
    const conteudo = await readFile(arquivo);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo)] || 'application/octet-stream' });
    res.end(conteudo);
  } catch {
    res.statusCode = 404;
    res.end('nao encontrado: ' + caminho);
  }
});

servidor.listen(PORTA, () => console.log('servidor local em http://localhost:' + PORTA + '/caderneta/'));
