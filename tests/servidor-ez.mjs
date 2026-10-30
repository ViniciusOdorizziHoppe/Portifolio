// Servidor local do Enemzeiro: estáticos + /api com PGlite no lugar do Neon.
//   node tests/servidor-ez.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const PORTA = 4400;
const RAIZ = fileURLToPath(new URL('../public/', import.meta.url));

const db = new PGlite();
await db.exec(readFileSync(new URL('../sql/enemzeiro.sql', import.meta.url), 'utf8'));
const { usarQueryDeTeste } = await import('../api/_db.js');
usarQueryDeTeste(async (text, params) => {
  const r = await db.query(text, params);
  return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length };
});

process.env.EZ_TRIAL_DIAS = '7';
process.env.EZ_WEBHOOK_HOTMART_TOKEN = 'tok-teste';
process.env.EZ_WEBHOOK_KIWIFY_TOKEN = 'tok-kiwify';

const rotas = {
  '/api/ez-cadastro': (await import('../api/ez-cadastro.js')).default,
  '/api/ez-entrar': (await import('../api/ez-entrar.js')).default,
  '/api/ez-ativar': (await import('../api/ez-ativar.js')).default,
  '/api/ez-sair': (await import('../api/ez-sair.js')).default,
  '/api/ez-sessao': (await import('../api/ez-sessao.js')).default,
  '/api/ez-progresso': (await import('../api/ez-progresso.js')).default,
  '/api/ez-conta': (await import('../api/ez-conta.js')).default,
  '/api/ez-webhook-hotmart': (await import('../api/ez-webhook-hotmart.js')).default,
  '/api/ez-webhook-kiwify': (await import('../api/ez-webhook-kiwify.js')).default
};

const TIPOS = { '.html': 'text/html; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.css': 'text/css; charset=utf-8' };

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORTA}`);
  const handler = rotas[url.pathname];

  if (handler) {
    // precisa do corpo cru para o webhook (HMAC)
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return res; };
    try { return await handler(req, res); }
    catch (e) { console.error('erro rota', url.pathname, e); res.statusCode = 500; return res.end('{"erro":"interno"}'); }
  }

  let caminho = url.pathname === '/' ? '/enemzeiro/index.html' : url.pathname;
  if (caminho.endsWith('/')) caminho += 'index.html';
  if (!extname(caminho)) caminho += '/index.html';

  try {
    const buf = await readFile(RAIZ + caminho);
    res.setHeader('Content-Type', TIPOS[extname(caminho)] || 'application/octet-stream');
    res.end(buf);
  } catch {
    res.statusCode = 404;
    res.end('nao encontrado: ' + caminho);
  }
});

servidor.listen(PORTA, () => console.log('ez local em http://localhost:' + PORTA + '/enemzeiro/'));
