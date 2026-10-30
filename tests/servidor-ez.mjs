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

const R = await import('../api/_ez-rotas.js');
const rotas = {
  '/api/ez/cadastro': R.cadastro,
  '/api/ez/entrar': R.entrar,
  '/api/ez/ativar': R.ativar,
  '/api/ez/sair': R.sair,
  '/api/ez/sessao': R.sessao,
  '/api/ez/progresso': R.progresso,
  '/api/ez/conta': R.conta,
  '/api/ez/webhook-hotmart': (req, res) => R.webhook(req, res, 'hotmart'),
  '/api/ez/webhook/kiwify': (req, res) => R.webhook(req, res, 'kiwify')
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
