// Verifica /api/hotmart-dashboard de ponta a ponta contra a Hotmart real,
// lendo a configuração da tabela dashboard_config (sem variáveis de ambiente).
//   node tests/verificar-dashboard.mjs [chave]
import { carregarEnvLocal } from './env-local.mjs';

carregarEnvLocal();

// força o caminho do banco: nenhuma credencial no ambiente
for (const k of Object.keys(process.env)) {
  if (k.startsWith('HOTMART_')) delete process.env[k];
}

const painel = (await import('../api/hotmart-dashboard.js')).default;

function chamar({ query = {}, headers = {} }) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      _headers: {},
      setHeader(k, v) { this._headers[k] = v; },
      end(corpo) {
        let dados = null;
        try { dados = JSON.parse(corpo); } catch { dados = corpo; }
        resolve({ status: this.statusCode, corpo: dados });
      }
    };
    painel({ method: 'GET', query, headers }, res);
  });
}

const chave = process.argv[2] || '';

const semChave = await chamar({ query: { dias: '30' } });
console.log('sem chave ->', semChave.status, semChave.corpo && semChave.corpo.erro);

const errada = await chamar({ query: { dias: '30' }, headers: { 'x-dash-key': 'chave-errada' } });
console.log('chave errada ->', errada.status, errada.corpo && errada.corpo.erro);

if (!chave) {
  console.log('\npasse a chave como argumento para testar o caminho autenticado');
  process.exit(0);
}

const ok = await chamar({ query: { dias: '30' }, headers: { 'x-dash-key': chave } });
console.log('chave correta ->', ok.status, ok.corpo && (ok.corpo.erro || 'ok'));

if (ok.status === 200) {
  console.log('ambiente:', ok.corpo.ambiente, '| total:', ok.corpo.total);
  console.log('janela:', new Date(ok.corpo.janela.de).toISOString().slice(0, 10), 'a',
    new Date(ok.corpo.janela.ate).toISOString().slice(0, 10));
  console.log('status consultados:', ok.corpo.statusConsultados.join(','));
  console.log('bruto por moeda:', JSON.stringify(ok.corpo.resumo.bruto));
  console.log('avisos:', JSON.stringify(ok.corpo.avisos));
} else {
  console.log('resposta:', JSON.stringify(ok.corpo));
}
