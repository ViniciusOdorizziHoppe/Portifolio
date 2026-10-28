// Servidor local do painel Hotmart: estáticos + /api/hotmart-dashboard,
// com a API da Hotmart substituída por um duplo de teste (sem credenciais reais).
//   node tests/servidor-dashboard.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORTA = Number(process.env.PORTA || 4400);
const RAIZ = fileURLToPath(new URL('../public/', import.meta.url));

process.env.HOTMART_DASH_KEY = process.env.HOTMART_DASH_KEY || 'teste123';
process.env.HOTMART_CLIENT_ID = 'cliente-de-teste';
process.env.HOTMART_CLIENT_SECRET = 'segredo-de-teste';

/* ---------------- duplo de teste da API da Hotmart ---------------- */

const PRODUTOS = [
  { id: 2125812, nome: 'Caderneta Digital' },
  { id: 3344556, nome: 'Odorizzi Store — Mentoria' }
];

const COMPRADORES = [
  ['Ian Victor Baptista', 'ian@teste.com'],
  ['Bárbara Sebastiana Cardoso', 'barbara@teste.com'],
  ['Marcio Klein', 'marcio.klein@teste.com'],
  ['Ana Paula Schumann', 'ana.schumann@teste.com'],
  ['Rafael Boeing', 'rafael.boeing@teste.com'],
  ['Juliana Maçaneiro', 'juliana.m@teste.com']
];

const PAGAMENTOS = ['PIX', 'CREDIT_CARD', 'BILLET', 'PIX', 'CREDIT_CARD', 'PIX'];

function gerarVendas(quantidade, status) {
  const agora = Date.now();
  const itens = [];
  for (let i = 0; i < quantidade; i++) {
    const comprador = COMPRADORES[i % COMPRADORES.length];
    const produto = PRODUTOS[i % PRODUTOS.length];
    const pagamento = PAGAMENTOS[i % PAGAMENTOS.length];
    const diasAtras = Math.floor((i * 29) / quantidade);
    const quando = agora - diasAtras * 86400000 - (i % 7) * 3600000;
    const valorBase = 97 + (i % 5) * 100;

    itens.push({
      product: { name: produto.nome, id: produto.id },
      buyer: { name: comprador[0], ucode: 'UC-' + i, email: comprador[1] },
      producer: { name: 'Vinícius Odorizzi Hoppe', ucode: 'PROD-1' },
      purchase: {
        transaction: 'HP' + (17000000000000 + i) + status.slice(0, 2),
        order_date: quando,
        approved_date: quando + 600000,
        status,
        recurrency_number: 1,
        is_subscription: produto.id === 2125812,
        commission_as: 'PRODUCER',
        price: { value: valorBase, currency_code: 'BRL' },
        payment: {
          method: pagamento === 'PIX' ? 'PIX' : (pagamento === 'BILLET' ? 'BILLET' : 'CREDIT_CARD_VISA'),
          installments_number: pagamento === 'CREDIT_CARD' ? 3 : 1,
          type: pagamento
        },
        tracking: {
          source: i % 2 ? 'instagram' : 'whatsapp',
          source_sck: 'HOTMART_PRODUCT_PAGE',
          external_code: 'EXT' + i
        },
        warranty_expire_date: quando + 7 * 86400000,
        offer: { payment_mode: 'UNIQUE_PAYMENT', code: 'of' + (i % 3) },
        hotmart_fee: {
          total: Math.round(valorBase * 0.099 * 100) / 100 + 2.49,
          fixed: 2.49,
          currency_code: 'BRL',
          base: valorBase,
          percentage: 9.9
        }
      }
    });
  }
  return itens;
}

const CENARIOS = {
  APPROVED: gerarVendas(38, 'APPROVED'),
  COMPLETE: gerarVendas(9, 'COMPLETE'),
  REFUNDED: gerarVendas(4, 'REFUNDED'),
  CHARGEBACK: gerarVendas(2, 'CHARGEBACK'),
  WAITING_PAYMENT: gerarVendas(6, 'WAITING_PAYMENT'),
  UNDER_ANALISYS: gerarVendas(3, 'UNDER_ANALISYS')
};

const TAMANHO_PAGINA = 10;
let chamadas = 0;

globalThis.fetch = async (entrada, opcoes = {}) => {
  const url = new URL(typeof entrada === 'string' ? entrada : entrada.url);
  chamadas += 1;

  const resposta = (corpo, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(corpo),
    json: async () => corpo
  });

  if (url.hostname === 'api-sec-vlc.hotmart.com') {
    if (!opcoes.headers || !String(opcoes.headers.Authorization || '').startsWith('Basic ')) {
      return resposta({ error: 'unauthorized' }, 401);
    }
    return resposta({ access_token: 'token-de-teste', token_type: 'bearer', expires_in: 172799, scope: 'read write' });
  }

  if (url.pathname === '/payments/api/v1/sales/history') {
    if (String(opcoes.headers.Authorization || '') !== 'Bearer token-de-teste') {
      return resposta({ error: 'unauthorized' }, 401);
    }
    const status = url.searchParams.get('transaction_status');
    const base = status
      ? (CENARIOS[status] || [])
      : [...CENARIOS.APPROVED, ...CENARIOS.COMPLETE]; // filtro padrão da Hotmart

    const inicio = Number(url.searchParams.get('page_token') || 0);
    const fim = inicio + TAMANHO_PAGINA;
    const fatia = base.slice(inicio, fim);
    const proximo = fim < base.length ? String(fim) : null;

    return resposta({
      items: fatia,
      page_info: {
        total_results: base.length,
        next_page_token: proximo,
        prev_page_token: inicio > 0 ? String(Math.max(0, inicio - TAMANHO_PAGINA)) : null,
        results_per_page: fatia.length
      }
    });
  }

  return resposta({ error: 'nao_encontrado' }, 404);
};

/* ---------------- estáticos + api ---------------- */

const painel = (await import('../api/hotmart-dashboard.js')).default;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4'
};

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/hotmart-dashboard') {
    const query = Object.fromEntries(url.searchParams.entries());
    req.query = query;
    console.log('[api] status=' + (query.status || 'padrão') + ' chamadas=' + chamadas);
    return painel(req, res);
  }

  let caminho = decodeURIComponent(url.pathname);
  if (caminho.endsWith('/')) caminho += 'index.html';
  const arquivo = join(RAIZ, normalize(caminho).replace(/^([/\\])+/, ''));
  if (!arquivo.startsWith(RAIZ)) {
    res.statusCode = 403;
    return res.end('fora da raiz');
  }

  try {
    const dados = await readFile(arquivo);
    res.statusCode = 200;
    res.setHeader('Content-Type', TIPOS[extname(arquivo)] || 'application/octet-stream');
    res.end(dados);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('não encontrado: ' + caminho);
  }
});

servidor.listen(PORTA, () => {
  console.log('painel em http://localhost:' + PORTA + '/hotmartdashboard/  chave: ' + process.env.HOTMART_DASH_KEY);
});
