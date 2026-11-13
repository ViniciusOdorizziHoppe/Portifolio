/* ────────────────────────────────────────────────────────────────
   ODORIZZI · painel pessoal
   Patrimônio, rendas, gastos e agenda — estado local, sem backend.
   ──────────────────────────────────────────────────────────────── */
'use strict';

const CHAVE = 'odorizzi_os_v1';
const CHAVE_TOKEN = 'odorizzi_token';
const API = '/api/odz';

/* ─────────── utilidades ─────────── */

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const pad = (n) => String(n).padStart(2, '0');

function isoHoje() {
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function dataDe(iso) { return new Date(iso + 'T12:00:00'); }
function isoDe(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function somaDias(iso, n) { const d = dataDe(iso); d.setDate(d.getDate() + n); return isoDe(d); }
function difDias(a, b) { return Math.round((dataDe(b) - dataDe(a)) / 86400000); }

const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const brlCurto = (v) => {
  const n = Number(v) || 0, a = Math.abs(n);
  if (a >= 1e6) return 'R$ ' + (n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';
  return brl(n);
};
const pct = (v) => (Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const DIAS_CURTO = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

function dataBonita(iso) {
  const d = dataDe(iso);
  return pad(d.getDate()) + ' ' + MESES_CURTO[d.getMonth()];
}
function dataLonga(iso) {
  const d = dataDe(iso);
  return DIAS_SEMANA[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()];
}

/* aceita 1.234,56 · 1234.56 · 1234,56 · R$ 69,90 */
function parseValor(txt) {
  if (typeof txt === 'number') return txt;
  let t = String(txt || '').replace(/[^\d.,-]/g, '').trim();
  if (!t) return NaN;
  const temVirgula = t.includes(',');
  const pontos = (t.match(/\./g) || []).length;
  if (temVirgula) {
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (pontos > 1) {
    t = t.replace(/\./g, '');
  } else if (pontos === 1) {
    const dec = t.split('.')[1];
    if (dec.length === 3) t = t.replace('.', '');
  }
  const n = parseFloat(t);
  return isNaN(n) ? NaN : n;
}

/* ─────────── estado ─────────── */

function estadoVazio() {
  return {
    v: 1,
    saldoInicial: { valor: 0, data: isoHoje() },
    fontes: [],
    fixos: [],
    lancamentos: [],
    eventos: [],
  };
}

let estado = estadoVazio();

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return;
    const lido = JSON.parse(bruto);
    if (!lido || typeof lido !== 'object') return;
    estado = Object.assign(estadoVazio(), lido);
    estado.saldoInicial = Object.assign({ valor: 0, data: isoHoje() }, lido.saldoInicial || {});
    estado.fontes = Array.isArray(lido.fontes) ? lido.fontes : [];
    estado.fixos = Array.isArray(lido.fixos) ? lido.fixos : [];
    estado.lancamentos = Array.isArray(lido.lancamentos) ? lido.lancamentos : [];
    estado.eventos = Array.isArray(lido.eventos) ? lido.eventos : [];
  } catch (e) {
    console.warn('Falha ao ler dados locais', e);
  }
}

function salvar() {
  estado.atualizadoEm = new Date().toISOString();
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch (e) {
    aviso('Não consegui salvar no navegador (armazenamento cheio?)');
  }
  agendarEnvio();
}

function aviso(msg) {
  const el = document.getElementById('aviso');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(aviso._t);
  aviso._t = setTimeout(() => { el.hidden = true; }, 2600);
}

/* ─────────── cálculos ─────────── */

const SINAL = { renda: 1, entrada: 1, gasto: -1, saida: -1 };
const TIPOS_POSITIVOS = ['renda', 'entrada'];

function ehPositivo(tipo) { return TIPOS_POSITIVOS.includes(tipo); }

function movimentos() {
  return estado.lancamentos
    .filter((l) => l && l.data && SINAL[l.tipo] !== undefined)
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

function patrimonioEm(iso) {
  const base = Number(estado.saldoInicial.valor) || 0;
  const ini = estado.saldoInicial.data || '0000-01-01';
  let total = base;
  for (const l of estado.lancamentos) {
    if (!SINAL[l.tipo]) continue;
    if (l.data < ini) continue;
    if (l.data > iso) continue;
    total += SINAL[l.tipo] * (Number(l.valor) || 0);
  }
  return total;
}

function patrimonioHoje() { return patrimonioEm(isoHoje()); }

function doMes(ano, mes) {
  const ini = ano + '-' + pad(mes + 1) + '-01';
  const fim = ano + '-' + pad(mes + 1) + '-' + pad(new Date(ano, mes + 1, 0).getDate());
  return estado.lancamentos.filter((l) => l.data >= ini && l.data <= fim);
}

function somaTipo(lista, tipos) {
  return lista.reduce((s, l) => (tipos.includes(l.tipo) ? s + (Number(l.valor) || 0) : s), 0);
}

function previstoMensalFonte(f) {
  const v = Number(f.valor) || 0;
  const vezes = Number(f.vezes) || 1;
  if (f.modo === 'mensal') return v;
  if (f.modo === 'semanal') return v * 4.333;
  if (f.modo === 'diaria') return v * 30;
  return v * vezes * (f.periodo === 'semana' ? 4.333 : 1);
}

function mensalFixo(f) {
  const v = Number(f.valor) || 0;
  if (f.freq === 'anual') return v / 12;
  if (f.freq === 'semanal') return v * 4.333;
  return v;
}

function previstoRendaMes() {
  return estado.fontes.reduce((s, f) => s + previstoMensalFonte(f), 0);
}
function totalFixosMes() {
  return estado.fixos.reduce((s, f) => s + mensalFixo(f), 0);
}

function seriePatrimonio(dias) {
  const hoje = isoHoje();
  const base = Number(estado.saldoInicial.valor) || 0;
  const iniSaldo = estado.saldoInicial.data || hoje;
  const movs = movimentos().filter((l) => l.data >= iniSaldo);

  let inicio;
  if (dias > 0) {
    inicio = somaDias(hoje, -(dias - 1));
  } else {
    inicio = iniSaldo;
    if (movs.length && movs[0].data < inicio) inicio = movs[0].data;
  }
  if (inicio > hoje) inicio = hoje;

  // acumulado até o dia anterior ao início da janela
  let valor = base;
  for (const l of movs) {
    if (l.data < inicio) valor += SINAL[l.tipo] * (Number(l.valor) || 0);
  }

  const porDia = new Map();
  for (const l of movs) {
    if (l.data < inicio || l.data > hoje) continue;
    porDia.set(l.data, (porDia.get(l.data) || 0) + SINAL[l.tipo] * (Number(l.valor) || 0));
  }

  const totalDias = difDias(inicio, hoje) + 1;
  const passo = totalDias > 900 ? Math.ceil(totalDias / 900) : 1;
  const pontos = [];
  let d = inicio;
  let i = 0;
  while (true) {
    valor += porDia.get(d) || 0;
    if (i % passo === 0 || d === hoje) pontos.push({ data: d, valor });
    i++;
    if (d === hoje) break;
    d = somaDias(d, 1);
  }
  return pontos;
}

function deltaPeriodo(dias) {
  const hoje = isoHoje();
  const agora = patrimonioEm(hoje);
  const antes = patrimonioEm(somaDias(hoje, -dias));
  const dif = agora - antes;
  const p = antes !== 0 ? (dif / Math.abs(antes)) * 100 : null;
  return { dif, p };
}

/* ─────────── componentes ─────────── */

function kpi(rotulo, valor, peHtml, valorClasse) {
  return '<article class="kpi">' +
    '<p class="kpi-rotulo"><i></i>' + rotulo + '</p>' +
    '<p class="kpi-valor' + (valorClasse ? ' ' + valorClasse : '') + '">' + valor + '</p>' +
    '<p class="kpi-pe">' + (peHtml || '&nbsp;') + '</p>' +
    '</article>';
}

function peDelta(dif, p, sufixo) {
  if ((!dif || Math.abs(dif) < 0.005) && p === null) return '<b class="neutro">sem histórico</b>';
  const classe = dif > 0 ? '' : dif < 0 ? ' baixa' : ' neutro';
  const seta = dif > 0 ? '▲' : dif < 0 ? '▼' : '•';
  const txtP = p === null ? '' : ' ' + pct(Math.abs(p));
  return '<b class="' + classe.trim() + '">' + seta + txtP + '</b> ' + (sufixo || '');
}

/* ─────────── dashboard ─────────── */

let faixaDias = 30;

function renderDashboard() {
  const hoje = isoHoje();
  const d = dataDe(hoje);
  const mes = doMes(d.getFullYear(), d.getMonth());
  const rendaMes = somaTipo(mes, ['renda']);
  const gastoMes = somaTipo(mes, ['gasto']);
  const saldoMes = rendaMes - gastoMes;
  const fixosMes = totalFixosMes();
  const previsto = previstoRendaMes();

  const d30 = deltaPeriodo(30);
  const hojeDelta = (function () {
    const dia = estado.lancamentos.filter((l) => l.data === hoje && SINAL[l.tipo]);
    return dia.reduce((s, l) => s + SINAL[l.tipo] * (Number(l.valor) || 0), 0);
  })();

  document.getElementById('kpis').innerHTML =
    kpi('Patrimônio', brlCurto(patrimonioHoje()),
      peDelta(d30.dif, d30.p, 'em 30 dias')) +
    kpi('Hoje', (hojeDelta > 0 ? '+' : '') + brl(hojeDelta),
      estado.lancamentos.some((l) => l.data === hoje) ? '<b class="neutro">movimento</b> registrado' : 'sem movimento hoje',
      hojeDelta < 0 ? 'neg' : '') +
    kpi('Renda do mês', brlCurto(rendaMes),
      previsto > 0 ? '<b class="neutro">previsto</b> ' + brl(previsto) : 'cadastre suas fontes') +
    kpi('Gastos do mês', brlCurto(gastoMes),
      fixosMes > 0 ? '<b class="neutro">fixos</b> ' + brl(fixosMes) + '/mês' : 'sem fixos cadastrados') +
    kpi('Saldo do mês', brlCurto(saldoMes),
      rendaMes > 0 ? '<b class="' + (saldoMes >= 0 ? '' : 'baixa') + '">' + pct((saldoMes / rendaMes) * 100) + '</b> da renda' : '&nbsp;',
      saldoMes < 0 ? 'neg' : '') +
    kpi('Fixo por mês', brlCurto(fixosMes),
      estado.fixos.length ? '<b class="neutro">' + estado.fixos.length + '</b> ' + (estado.fixos.length === 1 ? 'conta' : 'contas') : 'nenhuma assinatura');

  renderGrafico();
  renderTopFontes();
  renderDonut();
  renderResumoMes(mes, rendaMes, gastoMes);
}

function renderGrafico() {
  const svg = document.getElementById('grafico-svg');
  const caixa = document.getElementById('grafico');
  const vazio = document.getElementById('grafico-vazio');
  const pontos = seriePatrimonio(faixaDias);
  const temDados = estado.lancamentos.length > 0 || (Number(estado.saldoInicial.valor) || 0) !== 0;

  const larg = Math.max(320, caixa.clientWidth || 900);
  const alt = Math.max(180, caixa.clientHeight || 260);
  svg.setAttribute('viewBox', '0 0 ' + larg + ' ' + alt);
  svg.setAttribute('width', larg);
  svg.setAttribute('height', alt);

  const padL = 58, padR = 14, padT = 16, padB = 26;
  const largPlot = larg - padL - padR;
  const altPlot = alt - padT - padB;

  const valores = pontos.map((p) => p.valor);
  let min = Math.min.apply(null, valores.concat([Number(estado.saldoInicial.valor) || 0]));
  let max = Math.max.apply(null, valores.concat([Number(estado.saldoInicial.valor) || 0]));
  if (min === max) { min -= 50; max += 50; }
  const folga = (max - min) * 0.12;
  min -= folga; max += folga;

  const x = (i) => padL + (pontos.length <= 1 ? largPlot / 2 : (i / (pontos.length - 1)) * largPlot);
  const y = (v) => padT + altPlot - ((v - min) / (max - min)) * altPlot;

  let s = '';

  if (temDados) {
    // grades horizontais + rótulos de valor
    const passos = 4;
    for (let g = 0; g <= passos; g++) {
      const v = min + ((max - min) / passos) * g;
      const yy = y(v);
      s += '<line x1="' + padL + '" y1="' + yy.toFixed(1) + '" x2="' + (larg - padR) + '" y2="' + yy.toFixed(1) + '" stroke="#EFEDE6" stroke-width="1"/>';
      s += '<text x="' + (padL - 10) + '" y="' + (yy + 3.5).toFixed(1) + '" text-anchor="end">' + brlCurto(v).replace('R$ ', '') + '</text>';
    }

    // rótulos de data (menos no mobile)
    const quantos = Math.min(larg < 420 ? 3 : larg < 560 ? 4 : 6, pontos.length);
    for (let k = 0; k < quantos; k++) {
      const i = quantos === 1 ? 0 : Math.round((k / (quantos - 1)) * (pontos.length - 1));
      s += '<text x="' + x(i).toFixed(1) + '" y="' + (alt - 8) + '" text-anchor="' + (k === 0 ? 'start' : k === quantos - 1 ? 'end' : 'middle') + '">' + dataBonita(pontos[i].data) + '</text>';
    }
  }

  if (temDados && pontos.length) {
    const linha = pontos.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.valor).toFixed(1)).join(' ');
    const area = linha + ' L' + x(pontos.length - 1).toFixed(1) + ' ' + (padT + altPlot) + ' L' + x(0).toFixed(1) + ' ' + (padT + altPlot) + ' Z';

    s += '<defs><linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#F5C518" stop-opacity=".34"/>' +
      '<stop offset="100%" stop-color="#F5C518" stop-opacity="0"/>' +
      '</linearGradient></defs>';
    s += '<path d="' + area + '" fill="url(#grad-area)"/>';
    s += '<path d="' + linha + '" fill="none" stroke="#14140F" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';

    const ult = pontos[pontos.length - 1];
    s += '<circle cx="' + x(pontos.length - 1).toFixed(1) + '" cy="' + y(ult.valor).toFixed(1) + '" r="5" fill="#F5C518" stroke="#14140F" stroke-width="2"/>';

    // camada de interação
    s += '<line id="guia" x1="0" y1="' + padT + '" x2="0" y2="' + (padT + altPlot) + '" stroke="#C9C5B6" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>';
    s += '<rect id="captura" x="' + padL + '" y="' + padT + '" width="' + largPlot + '" height="' + altPlot + '" fill="transparent"/>';
  }

  svg.innerHTML = s;
  vazio.hidden = temDados;

  // pé do gráfico
  const pe = document.getElementById('grafico-pe');
  if (pontos.length) {
    const primeiro = pontos[0], ultimo = pontos[pontos.length - 1];
    const dif = ultimo.valor - primeiro.valor;
    const p = primeiro.valor !== 0 ? (dif / Math.abs(primeiro.valor)) * 100 : null;
    pe.innerHTML =
      '<span>Início do período <b>' + brl(primeiro.valor) + '</b></span>' +
      '<span>Hoje <b>' + brl(ultimo.valor) + '</b></span>' +
      '<span>Variação <b>' + (dif >= 0 ? '+' : '') + brl(dif) + '</b>' + (p === null ? '' : ' (' + pct(p) + ')') + '</span>' +
      '<span>Registros <b>' + estado.lancamentos.length + '</b></span>';
  } else {
    pe.innerHTML = '';
  }

  if (temDados) ligarHover(pontos, x, y, padL, largPlot);
}

function ligarHover(pontos, x, y, padL, largPlot) {
  const captura = document.getElementById('captura');
  const guia = document.getElementById('guia');
  const dica = document.getElementById('grafico-dica');
  if (!captura) return;

  const mover = (ev) => {
    const caixa = document.getElementById('grafico').getBoundingClientRect();
    const px = ev.clientX - caixa.left;
    const razao = Math.min(1, Math.max(0, (px - padL) / largPlot));
    const i = Math.round(razao * (pontos.length - 1));
    const p = pontos[i];
    const anterior = pontos[i - 1] || p;
    const dif = p.valor - anterior.valor;

    guia.setAttribute('x1', x(i)); guia.setAttribute('x2', x(i));
    guia.setAttribute('opacity', '1');
    dica.hidden = false;
    dica.innerHTML = '<div class="d-data">' + dataBonita(p.data) + '</div>' +
      '<div class="d-val">' + brl(p.valor) + '</div>' +
      (dif ? '<div class="d-delta">' + (dif > 0 ? '+' : '') + brl(dif) + ' no dia</div>' : '');
    const largDica = dica.offsetWidth || 120;
    let left = x(i);
    left = Math.max(largDica / 2 + 4, Math.min(caixa.width - largDica / 2 - 4, left));
    dica.style.left = left + 'px';
    dica.style.top = (y(p.valor) - 12) + 'px';
  };

  captura.addEventListener('pointermove', mover);
  captura.addEventListener('pointerdown', mover);
  captura.addEventListener('pointerleave', () => {
    guia.setAttribute('opacity', '0');
    dica.hidden = true;
  });
}

function renderTopFontes() {
  const alvo = document.getElementById('top-fontes');
  const fontes = estado.fontes.slice().sort((a, b) => previstoMensalFonte(b) - previstoMensalFonte(a)).slice(0, 5);
  if (!fontes.length) {
    alvo.innerHTML = '<li class="vazio">Nenhuma fonte cadastrada.<br><a href="#rendas" style="text-decoration:underline">Cadastrar renda</a></li>';
    return;
  }
  const maior = Math.max.apply(null, fontes.map(previstoMensalFonte)) || 1;
  alvo.innerHTML = fontes.map((f, i) => {
    const v = previstoMensalFonte(f);
    return '<li class="barra-linha">' +
      '<span class="barra-nome">' + esc(f.nome) + '</span>' +
      '<span class="barra-val">' + brl(v) + '</span>' +
      '<span class="barra-trilha"><span class="barra-preenche' + (i ? '' : '') + '" style="width:' + Math.max(4, (v / maior) * 100).toFixed(1) + '%"></span></span>' +
      '</li>';
  }).join('');
}

const CORES = ['#F5C518', '#14140F', '#8A8578', '#C9A227', '#5F5F55', '#B8B4A6', '#D8D4C7'];

function renderDonut() {
  const alvo = document.getElementById('donut-caixa');
  const d = dataDe(isoHoje());
  const mes = doMes(d.getFullYear(), d.getMonth());
  const gastos = mes.filter((l) => l.tipo === 'gasto');

  if (!gastos.length) {
    alvo.innerHTML = '<p class="vazio">Nenhum gasto lançado neste mês.</p>';
    return;
  }

  const porCat = new Map();
  for (const g of gastos) porCat.set(g.categoria || 'Outros', (porCat.get(g.categoria || 'Outros') || 0) + (Number(g.valor) || 0));
  const lista = Array.from(porCat.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = lista.reduce((s, x) => s + x[1], 0);

  const r = 48, circ = 2 * Math.PI * r;
  let offset = 0;
  let segmentos = '';
  lista.forEach((par, i) => {
    const fracao = total ? par[1] / total : 0;
    const comp = fracao * circ;
    segmentos += '<circle cx="62" cy="62" r="' + r + '" fill="none" stroke="' + CORES[i % CORES.length] +
      '" stroke-width="16" stroke-dasharray="' + comp.toFixed(2) + ' ' + (circ - comp).toFixed(2) +
      '" stroke-dashoffset="' + (-offset).toFixed(2) +
      '" transform="rotate(-90 62 62)" stroke-linecap="butt"/>';
    offset += comp;
  });

  alvo.innerHTML =
    '<svg class="donut-svg" viewBox="0 0 124 124" role="img" aria-label="Gastos por categoria">' +
    segmentos +
    '<text x="62" y="59" text-anchor="middle" class="donut-centro">' + brlCurto(total).replace('R$ ', '') + '</text>' +
    '<text x="62" y="72" text-anchor="middle" class="donut-centro-rot">R$ NO MÊS</text>' +
    '</svg>' +
    '<ul class="donut-legenda">' + lista.map((par, i) =>
      '<li><i style="background:' + CORES[i % CORES.length] + '"></i>' +
      '<span class="lg-nome">' + esc(par[0]) + '</span>' +
      '<span class="lg-val">' + Math.round((par[1] / total) * 100) + '%</span></li>').join('') +
    '</ul>';
}

function renderResumoMes(mes, rendaMes, gastoMes) {
  const hoje = isoHoje();
  const d = dataDe(hoje);
  document.getElementById('resumo-sub').textContent = MESES[d.getMonth()] + ' de ' + d.getFullYear();

  const diasComRegistro = new Set(estado.lancamentos.filter((l) => l.data.slice(0, 7) === hoje.slice(0, 7)).map((l) => l.data)).size;
  const maiorGasto = mes.filter((l) => l.tipo === 'gasto').sort((a, b) => b.valor - a.valor)[0];
  const mediaDia = gastoMes / (d.getDate() || 1);

  const linhas = [
    ['Entradas no mês', brl(rendaMes), 'pos'],
    ['Saídas no mês', brl(gastoMes), 'neg'],
    ['Dias com registro', diasComRegistro + ' de ' + d.getDate(), ''],
    ['Média de gasto/dia', brl(mediaDia), ''],
    ['Maior gasto', maiorGasto ? esc(String(maiorGasto.descricao || maiorGasto.categoria || 'Gasto')) + ' · ' + brl(maiorGasto.valor) : '—', ''],
  ];

  document.getElementById('resumo-mes').innerHTML = linhas.map((l) =>
    '<li><span class="ls-rot"><i class="ponto ' + (l[2] === 'pos' ? 'v' : l[2] === 'neg' ? 'r' : 'g') + '"></i><span>' + l[0] + '</span></span>' +
    '<span class="ls-val ' + (l[2] || '') + '">' + l[1] + '</span></li>').join('');
}

/* ─────────── patrimônio ─────────── */

let filtroMov = 'todos';

function renderPatrimonio() {
  const si = estado.saldoInicial;
  const f = document.getElementById('form-saldo-inicial');
  if (!f.dataset.tocado) {
    f.valor.value = si.valor ? String(si.valor).replace('.', ',') : '';
    f.data.value = si.data || isoHoje();
  }
  document.getElementById('ajuda-acertar').textContent =
    'Saldo atual no sistema: ' + brl(patrimonioHoje()) + '. A diferença vira um lançamento de ajuste.';

  const inicial = Number(si.valor) || 0;
  const altas = estado.lancamentos.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + (Number(l.valor) || 0), 0);
  const baixas = estado.lancamentos.filter((l) => l.tipo === 'saida').reduce((s, l) => s + (Number(l.valor) || 0), 0);
  const rendas = estado.lancamentos.filter((l) => l.tipo === 'renda').reduce((s, l) => s + (Number(l.valor) || 0), 0);
  const gastos = estado.lancamentos.filter((l) => l.tipo === 'gasto').reduce((s, l) => s + (Number(l.valor) || 0), 0);

  document.getElementById('situacao-patrimonio').innerHTML = [
    ['Saldo inicial (' + dataBonita(si.data || isoHoje()) + ')', brl(inicial), ''],
    ['Rendas recebidas', '+' + brl(rendas), 'pos'],
    ['Gastos pagos', '−' + brl(gastos), 'neg'],
    ['Altas manuais', '+' + brl(altas), 'pos'],
    ['Baixas manuais', '−' + brl(baixas), 'neg'],
    ['Patrimônio hoje', brl(patrimonioHoje()), ''],
  ].map((l, i) =>
    '<li><span class="ls-rot"><i class="ponto ' + (i === 5 ? '' : l[2] === 'pos' ? 'v' : l[2] === 'neg' ? 'r' : 'g') + '"></i><span>' + l[0] + '</span></span>' +
    '<span class="ls-val ' + (l[2] || '') + '">' + l[1] + '</span></li>').join('');

  const movs = estado.lancamentos
    .filter((l) => l.tipo === 'entrada' || l.tipo === 'saida')
    .filter((l) => filtroMov === 'todos' || l.tipo === filtroMov)
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));

  const corpo = document.querySelector('#tabela-movimentos tbody');
  document.getElementById('mov-vazio').hidden = movs.length > 0;
  document.getElementById('mov-sub').textContent = movs.length + (movs.length === 1 ? ' movimento' : ' movimentos') + ' de alta/baixa';
  corpo.innerHTML = movs.map((l) =>
    '<tr>' +
    '<td class="data">' + dataBonita(l.data) + '</td>' +
    '<td class="desc">' + esc(l.descricao || '—') + '</td>' +
    '<td><span class="marca-cat">' + esc(l.categoria || 'Outro') + '</span></td>' +
    '<td class="dir valor ' + (l.tipo === 'entrada' ? 'pos' : 'neg') + '">' + (l.tipo === 'entrada' ? '+' : '−') + brl(l.valor) + '</td>' +
    '<td class="dir"><button class="acao-remover" data-remover="' + l.id + '" title="Remover">×</button></td>' +
    '</tr>').join('');
}

/* ─────────── rendas ─────────── */

function renderRendas() {
  const d = dataDe(isoHoje());
  const mes = doMes(d.getFullYear(), d.getMonth());
  const recebido = somaTipo(mes, ['renda']);
  const previsto = previstoRendaMes();
  const fontes = estado.fontes;
  const media = fontes.length ? previsto / fontes.length : 0;
  const maior = fontes.slice().sort((a, b) => previstoMensalFonte(b) - previstoMensalFonte(a))[0];

  document.getElementById('kpis-rendas').innerHTML =
    kpi('Previsto/mês', brlCurto(previsto), fontes.length + (fontes.length === 1 ? ' fonte' : ' fontes')) +
    kpi('Recebido no mês', brlCurto(recebido), previsto > 0 ? '<b class="neutro">' + pct((recebido / previsto) * 100) + '</b> do previsto' : '&nbsp;') +
    kpi('Média por fonte', brlCurto(media), 'por mês') +
    kpi('Maior fonte', maior ? brlCurto(previstoMensalFonte(maior)) : '—', maior ? esc(maior.nome) : 'nenhuma');

  const alvo = document.getElementById('lista-fontes');
  const sub = document.getElementById('fontes-sub');
  sub.textContent = fontes.length ? fontes.length + ' cadastrada(s) · ' + brl(previsto) + ' por mês' : '';

  if (!fontes.length) {
    alvo.innerHTML = '<p class="vazio">Nenhuma fonte ainda.<br>Cadastre ao lado, por exemplo "Shopee afiliado — R$ 20 por venda, 5×/mês".</p>';
  } else {
    alvo.innerHTML = fontes.map((f) => {
      const modo = f.modo === 'por-execucao'
        ? (Number(f.vezes) || 1) + '× por ' + (f.periodo === 'semana' ? 'semana' : 'mês')
        : f.modo === 'mensal' ? 'fixa mensal' : f.modo === 'semanal' ? 'fixa semanal' : 'fixa diária';
      const detalhe = f.modo === 'por-execucao'
        ? brl(f.valor) + ' × ' + (Number(f.vezes) || 1) + (f.periodo === 'semana' ? '/sem' : '/mês')
        : brl(f.valor) + ' por ' + (f.modo === 'mensal' ? 'mês' : f.modo === 'semanal' ? 'semana' : 'dia');
      return '<div class="item-fonte">' +
        '<div class="fonte-info">' +
        '<div class="fonte-nome">' + esc(f.nome) + ' <span class="tag' + (f.modo === 'por-execucao' ? '' : ' apagada') + '">' + modo + '</span></div>' +
        '<div class="fonte-meta">' + detalhe + (f.dia ? ' · dia ' + f.dia : '') + '</div>' +
        '</div>' +
        '<div class="fonte-valores">' +
        '<div class="fonte-mensal">' + brl(previstoMensalFonte(f)) + '</div>' +
        '<div class="fonte-detalhe">previsto/mês</div>' +
        '</div>' +
        '<div class="fonte-acoes">' +
        '<button class="btn btn-mini" data-recebi="' + f.id + '">Recebi</button>' +
        '<button class="acao-remover" data-remover-fonte="' + f.id + '" title="Remover">×</button>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  const recebs = estado.lancamentos.filter((l) => l.tipo === 'renda').sort((a, b) => (a.data < b.data ? 1 : -1));
  const corpo = document.querySelector('#tabela-recebimentos tbody');
  document.getElementById('receb-vazio').hidden = recebs.length > 0;
  document.getElementById('receb-sub').textContent = recebs.length ? recebs.length + ' lançamento(s) · ' + brl(rendaTotal()) + ' no total' : '';
  corpo.innerHTML = recebs.slice(0, 60).map((l) => {
    const fonte = estado.fontes.find((f) => f.id === l.fonteId);
    return '<tr>' +
      '<td class="data">' + dataBonita(l.data) + '</td>' +
      '<td class="desc">' + esc(fonte ? fonte.nome : l.categoria || '—') + '</td>' +
      '<td class="desc">' + esc(l.descricao || '—') + '</td>' +
      '<td class="dir valor pos">+' + brl(l.valor) + '</td>' +
      '<td class="dir"><button class="acao-remover" data-remover="' + l.id + '" title="Remover">×</button></td>' +
      '</tr>';
  }).join('');
}

function rendaTotal() {
  return estado.lancamentos.filter((l) => l.tipo === 'renda').reduce((s, l) => s + (Number(l.valor) || 0), 0);
}

/* ─────────── gastos ─────────── */

function renderGastos() {
  const d = dataDe(isoHoje());
  const mes = doMes(d.getFullYear(), d.getMonth());
  const gastoMes = somaTipo(mes, ['gasto']);
  const fixosMes = totalFixosMes();
  const variaveis = estado.lancamentos.filter((l) => l.tipo === 'gasto').reduce((s, l) => s + (Number(l.valor) || 0), 0);
  const mediaDia = gastoMes / (d.getDate() || 1);

  document.getElementById('kpis-gastos').innerHTML =
    kpi('Gasto no mês', brlCurto(gastoMes), MESES[d.getMonth()]) +
    kpi('Fixo por mês', brlCurto(fixosMes), estado.fixos.length + ' conta(s)') +
    kpi('Variado total', brlCurto(variaveis), 'lançado no período') +
    kpi('Média por dia', brlCurto(mediaDia), 'no mês atual');

  const alvo = document.getElementById('lista-fixos');
  document.getElementById('fixos-sub').textContent = estado.fixos.length ? brl(fixosMes) + ' por mês' : '';
  if (!estado.fixos.length) {
    alvo.innerHTML = '<p class="vazio">Nenhuma assinatura ou conta fixa.<br>Cadastre ao lado (Spotify, internet, aluguel…).</p>';
  } else {
    alvo.innerHTML = estado.fixos.slice().sort((a, b) => Number(a.dia) - Number(b.dia)).map((f) =>
      '<div class="item-fonte">' +
      '<div class="fonte-info">' +
      '<div class="fonte-nome">' + esc(f.nome) + '</div>' +
      '<div class="fonte-meta">todo dia ' + f.dia + ' · ' + esc(f.freq) + ' · ' + esc(f.categoria) + '</div>' +
      '</div>' +
      '<div class="fonte-valores">' +
      '<div class="fonte-mensal">' + brl(mensalFixo(f)) + '</div>' +
      '<div class="fonte-detalhe">' + (f.freq === 'mensal' ? brl(f.valor) + ' /mês' : f.freq === 'anual' ? brl(f.valor) + ' /ano' : brl(f.valor) + ' /sem') + '</div>' +
      '</div>' +
      '<div class="fonte-acoes">' +
      '<button class="btn btn-mini" data-pagar="' + f.id + '">Paguei</button>' +
      '<button class="acao-remover" data-remover-fixo="' + f.id + '" title="Remover">×</button>' +
      '</div>' +
      '</div>').join('');
  }

  const gv = estado.lancamentos.filter((l) => l.tipo === 'gasto').sort((a, b) => (a.data < b.data ? 1 : -1));
  const corpo = document.querySelector('#tabela-variaveis tbody');
  document.getElementById('variaveis-vazio').hidden = gv.length > 0;
  corpo.innerHTML = gv.slice(0, 80).map((l) =>
    '<tr>' +
    '<td class="data">' + dataBonita(l.data) + '</td>' +
    '<td class="desc">' + esc(l.descricao || '—') + '</td>' +
    '<td><span class="marca-cat">' + esc(l.categoria || 'Outros') + '</span></td>' +
    '<td class="dir valor neg">−' + brl(l.valor) + '</td>' +
    '<td class="dir"><button class="acao-remover" data-remover="' + l.id + '" title="Remover">×</button></td>' +
    '</tr>').join('');
}

/* ─────────── calendário ─────────── */

let mesCal = (function () { const d = new Date(); return { ano: d.getFullYear(), mes: d.getMonth() }; })();
let diaEscolhido = isoHoje();

function itensDoDia(iso, semFixos) {
  const itens = [];
  for (const l of estado.lancamentos) {
    if (l.data !== iso) continue;
    if (l.tipo === 'renda' || l.tipo === 'entrada') {
      itens.push({ tipo: 'renda', nome: l.descricao || (estado.fontes.find((f) => f.id === l.fonteId) || {}).nome || l.categoria || 'Entrada', valor: l.valor, id: l.id });
    } else if (l.tipo === 'gasto' || l.tipo === 'saida') {
      itens.push({ tipo: 'gasto', nome: l.descricao || l.categoria || 'Saída', valor: l.valor, id: l.id });
    }
  }
  const dia = Number(iso.slice(8, 10));
  if (!semFixos) {
    for (const f of estado.fixos) {
      if (Number(f.dia) === dia) itens.push({ tipo: 'fixo', nome: f.nome, valor: mensalFixo(f), previsto: true });
    }
  }
  for (const e of estado.eventos) {
    if (e.data === iso) itens.push({ tipo: 'evento', nome: e.titulo, hora: e.hora, id: e.id });
  }
  return itens;
}

function renderCalendario() {
  const { ano, mes } = mesCal;
  document.getElementById('cal-titulo').textContent = MESES[mes].charAt(0).toUpperCase() + MESES[mes].slice(1) + ' de ' + ano;

  const hoje = isoHoje();
  const primeiro = new Date(ano, mes, 1);
  const inicioSemana = (primeiro.getDay() + 6) % 7; // segunda = 0
  const inicio = new Date(ano, mes, 1 - inicioSemana);
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const celulas = Math.ceil((inicioSemana + ultimoDia) / 7) * 7;

  document.getElementById('cal-semana').innerHTML = DIAS_CURTO.map((d) => '<span>' + d + '</span>').join('');

  let html = '';
  let movMes = 0, rendaMes = 0, gastoMes = 0;
  for (let i = 0; i < celulas; i++) {
    const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
    const iso = isoDe(d);
    const deOutroMes = d.getMonth() !== mes;
    const itens = itensDoDia(iso, deOutroMes);
    if (!deOutroMes) {
      for (const it of itens) {
        if (it.previsto) continue;
        movMes++;
        if (it.tipo === 'renda') rendaMes += Number(it.valor) || 0;
        else gastoMes += Number(it.valor) || 0;
      }
    }
    const clsDe = (it) => it.tipo === 'renda' ? 'renda' : it.tipo === 'gasto' ? 'gasto' : it.tipo === 'evento' ? 'evento' : 'fixo';
    let chips = '';
    if (window.matchMedia('(max-width: 640px)').matches) {
      const maxPontos = 4;
      chips = '<span class="pontos">' +
        itens.slice(0, maxPontos).map((it) => '<i class="pt ' + clsDe(it) + '" title="' + esc(it.nome) + '"></i>').join('') +
        (itens.length > maxPontos ? '<em class="pt-mais">+' + (itens.length - maxPontos) + '</em>' : '') +
        '</span>';
    } else {
      chips = itens.slice(0, 3).map((it) => {
        const txt = it.tipo === 'evento'
          ? (it.hora ? it.hora + ' ' : '') + esc(it.nome)
          : (it.tipo === 'renda' ? '+' : '') + brlCurto(it.valor).replace('R$ ', '');
        return '<span class="chip ' + clsDe(it) + '" title="' + esc(it.nome) + '">' + txt + '</span>';
      }).join('');
      if (itens.length > 3) chips += '<span class="chip mais">+' + (itens.length - 3) + '</span>';
    }

    html += '<button class="cal-dia' + (deOutroMes ? ' fora' : '') + (iso === hoje ? ' hoje' : '') + (iso === diaEscolhido ? ' escolhido' : '') + '" data-dia="' + iso + '">' +
      '<span class="cal-num">' + d.getDate() + '</span>' +
      '<span class="chips">' + chips + '</span>' +
      '</button>';
  }
  document.getElementById('cal-mes').innerHTML = html;

  document.getElementById('cal-sub').textContent =
    movMes + ' lançamento(s) · +' + brl(rendaMes) + ' · −' + brl(gastoMes);

  renderDia();
}

function renderDia() {
  const iso = diaEscolhido;
  const itens = itensDoDia(iso);
  document.getElementById('dia-titulo').textContent = dataLonga(iso);
  document.getElementById('dia-sub').textContent = iso === isoHoje() ? 'hoje' : '';

  const alvo = document.getElementById('dia-lista');
  if (!itens.length) {
    alvo.innerHTML = '<p class="vazio">Nada neste dia.<br>Adicione um compromisso abaixo.</p>';
  } else {
    alvo.innerHTML = itens.map((it) => {
      const cls = it.tipo === 'renda' ? 'renda' : it.tipo === 'gasto' ? 'gasto' : it.tipo === 'evento' ? 'evento' : 'fixo';
      const dir = it.tipo === 'renda' ? '+' : it.tipo === 'gasto' ? '−' : '';
      return '<div class="dia-item ' + cls + '">' +
        '<div class="di-txt">' +
        '<div class="di-nome">' + esc(it.nome) + '</div>' +
        (it.hora ? '<div class="di-hora">' + it.hora + '</div>' : it.previsto ? '<div class="di-hora">cobrança prevista</div>' : '') +
        '</div>' +
        (it.valor !== undefined && it.valor !== null && !it.hora
          ? '<div class="di-val">' + dir + brl(it.valor) + '</div>'
          : (it.id && it.tipo === 'evento' ? '<button class="acao-remover" data-remover-evento="' + it.id + '" title="Remover">×</button>' : '')) +
        '</div>';
    }).join('');
  }

  const rendas = itens.filter((i) => i.tipo === 'renda').reduce((s, i) => s + (Number(i.valor) || 0), 0);
  const gastos = itens.filter((i) => i.tipo === 'gasto').reduce((s, i) => s + (Number(i.valor) || 0), 0);
  if (itens.length) {
    alvo.innerHTML += '<div class="dia-resumo"><span>entradas <b>' + brl(rendas) + '</b></span><span>saídas <b>' + brl(gastos) + '</b></span></div>';
  }
}

/* ─────────── nuvem ─────────── */

const nuvem = { token: null, estado: 'local', timer: null, enviando: false, erro: null };

function nuvemToken() {
  try { return localStorage.getItem(CHAVE_TOKEN) || ''; } catch (e) { return ''; }
}

function dataHoraBonita(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function nuvemPintar() {
  const ponto = document.getElementById('nuvem-dot');
  const txt = document.getElementById('nuvem-txt');
  const conectado = !!nuvemToken();
  let classe = '';
  let rotulo = 'Nuvem';

  if (conectado) {
    if (nuvem.estado === 'ok') { classe = 'ok'; rotulo = 'Sincronizado'; }
    else if (nuvem.estado === 'pendente') { classe = 'pendente'; rotulo = 'Enviando…'; }
    else if (nuvem.estado === 'erro') { classe = 'erro'; rotulo = 'Sem conexão'; }
    else { classe = 'ok'; rotulo = 'Sincronizado'; }
  }
  if (ponto) ponto.className = 'nuvem-dot ' + classe;
  if (txt) txt.textContent = rotulo;

  const est = document.getElementById('nuvem-estado');
  if (est) {
    est.className = 'nuvem-estado';
    if (!conectado) {
      est.textContent = 'Ainda não conectado. O que você lançar está salvo só neste navegador.';
    } else if (nuvem.estado === 'erro') {
      est.className = 'nuvem-estado erro';
      est.textContent = 'Não consegui falar com a VPS (' + (nuvem.erro || 'sem resposta') + '). Tudo continua salvo neste aparelho e eu tento de novo.';
    } else {
      est.className = 'nuvem-estado ok';
      est.textContent = 'Conectado. Último envio: ' + (estado.atualizadoEm ? dataHoraBonita(estado.atualizadoEm) : '—');
    }
  }

  const sair = document.getElementById('nuvem-sair');
  if (sair) sair.hidden = !conectado;
  const form = document.getElementById('form-nuvem');
  if (form) form.hidden = conectado;
}

async function nuvemChamar(rota, opcoes) {
  const cfg = opcoes || {};
  const cab = { 'content-type': 'application/json' };
  const t = nuvemToken();
  if (t) cab.authorization = 'Bearer ' + t;

  const resposta = await fetch(API + '?rota=' + rota, {
    method: cfg.metodo || 'GET',
    headers: cab,
    body: cfg.corpo ? JSON.stringify(cfg.corpo) : undefined,
    cache: 'no-store',
  });

  let dados = null;
  try { dados = await resposta.json(); } catch (e) { dados = null; }

  if (resposta.status === 401 && rota !== 'entrar') {
    try { localStorage.removeItem(CHAVE_TOKEN); } catch (e) {}
    nuvem.estado = 'local';
    nuvemPintar();
    throw new Error('sessao_expirada');
  }
  if (!resposta.ok) throw new Error((dados && dados.erro) || 'http ' + resposta.status);
  return dados;
}

async function nuvemConectar(chave) {
  const d = await nuvemChamar('entrar', { metodo: 'POST', corpo: { chave } });
  try { localStorage.setItem(CHAVE_TOKEN, d.token); } catch (e) {}
  nuvem.estado = 'ok';
  nuvem.erro = null;
  nuvemPintar();
  await nuvemSincronizarTudo();
}

async function nuvemSincronizarTudo() {
  const remoto = await nuvemChamar('estado');
  const localQuando = estado.atualizadoEm || '';
  const localTemDados = (estado.lancamentos.length || estado.fontes.length || estado.fixos.length || Number(estado.saldoInicial.valor) || 0);

  // dados antigos, salvos antes de existir nuvem: empurra eles pra cima
  if (!localQuando && localTemDados) {
    estado.atualizadoEm = new Date().toISOString();
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {}
    await nuvemEnviar();
    return;
  }

  if (!remoto || remoto.vazio || !remoto.estado) {
    if (localTemDados) await nuvemEnviar();
    nuvem.estado = 'ok';
    nuvemPintar();
    return;
  }

  if ((remoto.atualizadoEm || '') > localQuando) {
    estado = Object.assign(estadoVazio(), remoto.estado);
    estado.saldoInicial = Object.assign({ valor: 0, data: isoHoje() }, remoto.estado.saldoInicial || {});
    estado.fontes = Array.isArray(remoto.estado.fontes) ? remoto.estado.fontes : [];
    estado.fixos = Array.isArray(remoto.estado.fixos) ? remoto.estado.fixos : [];
    estado.lancamentos = Array.isArray(remoto.estado.lancamentos) ? remoto.estado.lancamentos : [];
    estado.eventos = Array.isArray(remoto.estado.eventos) ? remoto.estado.eventos : [];
    estado.atualizadoEm = remoto.atualizadoEm;
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {}
    renderizarTudo();
    aviso('Dados atualizados da nuvem');
  } else if (localQuando > (remoto.atualizadoEm || '')) {
    await nuvemEnviar();
  }

  nuvem.estado = 'ok';
  nuvem.erro = null;
  nuvemPintar();
}

async function nuvemEnviar() {
  if (!nuvemToken()) return;
  if (nuvem.enviando) { nuvem.pendente = true; return; }
  nuvem.enviando = true;
  nuvem.pendente = false;
  try {
    await nuvemChamar('estado', { metodo: 'PUT', corpo: { estado, atualizadoEm: estado.atualizadoEm } });
    nuvem.estado = 'ok';
    nuvem.erro = null;
  } catch (e) {
    if (e.message !== 'sessao_expirada') {
      nuvem.estado = 'erro';
      nuvem.erro = e.message;
      nuvem.pendente = true;
    }
  } finally {
    nuvem.enviando = false;
    nuvemPintar();
    if (nuvem.pendente && nuvem.estado === 'ok') agendarEnvio();
  }
}

function agendarEnvio() {
  if (!nuvemToken()) return;
  nuvem.estado = 'pendente';
  nuvemPintar();
  clearTimeout(nuvem.timer);
  nuvem.timer = setTimeout(() => { nuvemEnviar(); }, 1200);
}

function abrirNuvem() {
  const m = document.getElementById('modal-nuvem');
  m.hidden = false;
  nuvemPintar();
  const campo = document.querySelector('#form-nuvem input[name="chave"]');
  if (campo && !nuvemToken()) setTimeout(() => campo.focus(), 40);
}

function fecharNuvem() {
  document.getElementById('modal-nuvem').hidden = true;
}

/* ─────────── navegação ─────────── */

const TITULOS = { dashboard: 'Dashboard', patrimonio: 'Patrimônio', rendas: 'Rendas', gastos: 'Gastos', calendario: 'Calendário' };

function irPara(aba) {
  if (!TITULOS[aba]) aba = 'dashboard';
  document.querySelectorAll('.tela').forEach((t) => { t.hidden = t.id !== 'tela-' + aba; });
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('ativo', n.dataset.aba === aba));
  document.getElementById('topo-titulo').textContent = TITULOS[aba];
  document.getElementById('topo-olho').textContent = aba === 'dashboard' ? 'Painel pessoal' : 'ODORIZZI · ' + TITULOS[aba].toLowerCase();

  // no mobile a navegação é uma faixa horizontal: traz o item ativo para a vista
  const ativo = document.querySelector('.nav-item.ativo');
  if (ativo && window.innerWidth <= 900 && ativo.scrollIntoView) {
    ativo.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  if (aba === 'dashboard') renderDashboard();
  if (aba === 'patrimonio') renderPatrimonio();
  if (aba === 'rendas') renderRendas();
  if (aba === 'gastos') renderGastos();
  if (aba === 'calendario') renderCalendario();
}

function abaAtual() {
  const h = (location.hash || '#dashboard').replace('#', '');
  return TITULOS[h] ? h : 'dashboard';
}

/* ─────────── modal de lançamento rápido ─────────── */

let tipoRapido = 'renda';

const CATEGORIAS_RAPIDO = {
  renda: ['Shopee afiliado', 'Freela', 'Venda', 'Serviço', 'Outros'],
  gasto: ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Estudos', 'Casa', 'Vestuário', 'Outros'],
  entrada: ['Venda', 'Aporte', 'Ajuste', 'Outro'],
  saida: ['Retirada', 'Ajuste', 'Outro'],
};

function abrirModal(pre) {
  pre = pre || {};
  const m = document.getElementById('modal');
  m.hidden = false;
  const f = document.getElementById('form-rapido');
  f.dataset.tocado = '';
  f.reset();
  f.data.value = pre.data || isoHoje();
  trocarTipoRapido(pre.tipo || tipoRapido);
  if (pre.valor) f.valor.value = String(pre.valor).replace('.', ',');
  if (pre.descricao) f.descricao.value = pre.descricao;
  if (pre.categoria) definirCategoria(pre.categoria);
  if (pre.fonteId) document.getElementById('rapido-fonte').value = pre.fonteId;
  setTimeout(() => f.valor.focus(), 30);
}

function definirCategoria(nome) {
  const sel = document.getElementById('rapido-categoria');
  if (!sel) return;
  const existe = Array.prototype.some.call(sel.options, (o) => o.value === nome);
  if (!existe) {
    const o = document.createElement('option');
    o.textContent = nome;
    o.value = nome;
    sel.appendChild(o);
  }
  sel.value = nome;
}

function fecharModal() { document.getElementById('modal').hidden = true; }

function trocarTipoRapido(tipo) {
  tipoRapido = tipo;
  document.querySelectorAll('#rapido-tipo button').forEach((b) => b.classList.toggle('ativo', b.dataset.tipo === tipo));
  const sel = document.getElementById('rapido-categoria');
  sel.innerHTML = (CATEGORIAS_RAPIDO[tipo] || []).map((c) => '<option>' + c + '</option>').join('');
  const campoFonte = document.getElementById('campo-fonte-rapido');
  const fonte = document.getElementById('rapido-fonte');
  if (tipo === 'renda') {
    campoFonte.hidden = false;
    fonte.innerHTML = '<option value="">— sem fonte —</option>' +
      estado.fontes.map((f) => '<option value="' + f.id + '">' + esc(f.nome) + '</option>').join('');
  } else {
    campoFonte.hidden = true;
  }
}

/* ─────────── ações ─────────── */

function addLancamento(dados) {
  const l = Object.assign({ id: uid() }, dados);
  estado.lancamentos.push(l);
  salvar();
  return l;
}

function removerLancamento(id) {
  estado.lancamentos = estado.lancamentos.filter((l) => l.id !== id);
  salvar();
  renderizarTudo();
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderizarTudo() { irPara(abaAtual()); }

/* ─────────── ligações de eventos ─────────── */

function ligar() {
  document.getElementById('topo-data').textContent = (function () {
    const d = new Date();
    return DIAS_SEMANA[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear();
  })();

  window.addEventListener('hashchange', () => irPara(abaAtual()));

  document.querySelectorAll('.nav-item').forEach((n) => {
    n.addEventListener('click', () => setTimeout(() => irPara(abaAtual()), 0));
  });

  // faixas do gráfico
  document.getElementById('faixas').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    faixaDias = Number(b.dataset.dias);
    document.querySelectorAll('#faixas button').forEach((x) => x.classList.toggle('ativo', x === b));
    renderGrafico();
  });

  // saldo inicial
  document.getElementById('form-saldo-inicial').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const v = parseValor(f.valor.value);
    if (isNaN(v)) return aviso('Valor inválido');
    estado.saldoInicial = { valor: v, data: f.data.value || isoHoje() };
    f.dataset.tocado = '1';
    salvar();
    aviso('Saldo inicial salvo');
    renderizarTudo();
  });
  document.getElementById('form-saldo-inicial').addEventListener('input', (e) => { e.target.form.dataset.tocado = '1'; });

  // acertar saldo
  document.getElementById('form-acertar').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const real = parseValor(f.valor.value);
    if (isNaN(real)) return aviso('Valor inválido');
    const dif = real - patrimonioHoje();
    if (Math.abs(dif) < 0.01) { aviso('Já está batendo com o saldo do sistema'); return; }
    addLancamento({
      data: isoHoje(),
      tipo: dif > 0 ? 'entrada' : 'saida',
      valor: Math.abs(dif),
      categoria: 'Ajuste',
      descricao: 'Acerto de saldo (' + (dif > 0 ? 'alta' : 'baixa') + ')',
    });
    f.reset();
    aviso('Ajuste de ' + brl(Math.abs(dif)) + ' lançado');
    renderizarTudo();
  });

  // movimento manual
  let movTipo = 'entrada';
  document.getElementById('mov-tipo').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    movTipo = b.dataset.tipo;
    document.querySelectorAll('#mov-tipo button').forEach((x) => x.classList.toggle('ativo', x === b));
  });
  const fm = document.getElementById('form-movimento');
  fm.data.value = isoHoje();
  fm.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseValor(fm.valor.value);
    if (isNaN(v) || v <= 0) return aviso('Valor inválido');
    addLancamento({ data: fm.data.value || isoHoje(), tipo: movTipo, valor: v, categoria: fm.categoria.value, descricao: fm.descricao.value.trim() });
    fm.valor.value = '';
    fm.descricao.value = '';
    aviso('Movimento registrado');
    renderizarTudo();
  });

  // filtro de movimentos
  document.getElementById('filtro-mov').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    filtroMov = b.dataset.filtro;
    document.querySelectorAll('#filtro-mov button').forEach((x) => x.classList.toggle('ativo', x === b));
    renderPatrimonio();
  });

  // nova fonte de renda
  const fr = document.getElementById('form-renda');
  fr.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseValor(fr.valor.value);
    if (isNaN(v) || v <= 0) return aviso('Valor inválido');
    estado.fontes.push({
      id: uid(),
      nome: fr.nome.value.trim() || 'Fonte',
      valor: v,
      modo: fr.modo.value,
      vezes: Number(fr.vezes.value) || 1,
      periodo: fr.periodo.value,
      dia: fr.dia.value ? Number(fr.dia.value) : null,
    });
    salvar();
    fr.reset();
    atualizarCamposRenda();
    aviso('Fonte adicionada');
    renderizarTudo();
  });

  const atualizarCamposRenda = () => {
    const modo = fr.modo.value;
    const porExec = modo === 'por-execucao';
    document.getElementById('campo-vezes').hidden = !porExec;
    document.getElementById('campo-periodo').hidden = !porExec;
    document.getElementById('ajuda-renda').textContent = porExec
      ? 'Previsto por mês = valor × vezes (semana conta 4,33 por mês).'
      : 'Renda que cai sempre, mesmo sem você produzir naquele dia.';
  };
  fr.modo.addEventListener('change', atualizarCamposRenda);
  atualizarCamposRenda();

  // novo fixo
  const ff = document.getElementById('form-fixo');
  ff.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseValor(ff.valor.value);
    if (isNaN(v) || v <= 0) return aviso('Valor inválido');
    estado.fixos.push({
      id: uid(),
      nome: ff.nome.value.trim() || 'Conta',
      valor: v,
      freq: ff.freq.value,
      dia: Number(ff.dia.value) || 1,
      categoria: ff.categoria.value,
    });
    salvar();
    ff.reset();
    aviso('Gasto fixo adicionado');
    renderizarTudo();
  });

  // gasto variado
  const fv = document.getElementById('form-variavel');
  fv.data.value = isoHoje();
  fv.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseValor(fv.valor.value);
    if (isNaN(v) || v <= 0) return aviso('Valor inválido');
    addLancamento({ data: fv.data.value || isoHoje(), tipo: 'gasto', valor: v, categoria: fv.categoria.value, descricao: fv.descricao.value.trim() });
    fv.valor.value = '';
    fv.descricao.value = '';
    aviso('Gasto lançado');
    renderizarTudo();
  });

  // calendário
  document.getElementById('cal-ante').addEventListener('click', () => {
    mesCal.mes--;
    if (mesCal.mes < 0) { mesCal.mes = 11; mesCal.ano--; }
    renderCalendario();
  });
  document.getElementById('cal-prox').addEventListener('click', () => {
    mesCal.mes++;
    if (mesCal.mes > 11) { mesCal.mes = 0; mesCal.ano++; }
    renderCalendario();
  });
  document.getElementById('cal-hoje').addEventListener('click', () => {
    const d = new Date();
    mesCal = { ano: d.getFullYear(), mes: d.getMonth() };
    diaEscolhido = isoHoje();
    renderCalendario();
  });
  document.getElementById('cal-mes').addEventListener('click', (e) => {
    const b = e.target.closest('.cal-dia');
    if (!b) return;
    diaEscolhido = b.dataset.dia;
    const [a, m] = diaEscolhido.split('-').map(Number);
    if (m - 1 !== mesCal.mes) mesCal = { ano: a, mes: m - 1 };
    renderCalendario();
  });
  document.getElementById('form-evento').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const titulo = f.titulo.value.trim();
    if (!titulo) return;
    estado.eventos.push({ id: uid(), data: diaEscolhido, titulo, hora: f.hora.value || '' });
    salvar();
    f.reset();
    aviso('Compromisso adicionado');
    renderCalendario();
  });

  // remoções (delegado)
  document.addEventListener('click', (e) => {
    const alvo = e.target.closest('[data-remover],[data-remover-fonte],[data-remover-fixo],[data-remover-evento],[data-recebi],[data-pagar]');
    if (!alvo) return;

    if (alvo.dataset.remover) {
      if (!confirm('Remover este lançamento?')) return;
      removerLancamento(alvo.dataset.remover);
    }
    if (alvo.dataset.removerFonte) {
      if (!confirm('Remover esta fonte de renda?')) return;
      estado.fontes = estado.fontes.filter((f) => f.id !== alvo.dataset.removerFonte);
      salvar(); renderizarTudo();
    }
    if (alvo.dataset.removerFixo) {
      if (!confirm('Remover este gasto fixo?')) return;
      estado.fixos = estado.fixos.filter((f) => f.id !== alvo.dataset.removerFixo);
      salvar(); renderizarTudo();
    }
    if (alvo.dataset.removerEvento) {
      estado.eventos = estado.eventos.filter((x) => x.id !== alvo.dataset.removerEvento);
      salvar(); renderCalendario();
    }
    if (alvo.dataset.recebi) {
      const f = estado.fontes.find((x) => x.id === alvo.dataset.recebi);
      if (!f) return;
      abrirModal({ tipo: 'renda', valor: f.valor, fonteId: f.id, categoria: f.nome, descricao: '' });
    }
    if (alvo.dataset.pagar) {
      const f = estado.fixos.find((x) => x.id === alvo.dataset.pagar);
      if (!f) return;
      abrirModal({ tipo: 'gasto', valor: f.valor, categoria: f.categoria, descricao: f.nome });
    }
  });

  // modal
  document.getElementById('btn-lancar').addEventListener('click', abrirModal);
  document.getElementById('modal-fechar').addEventListener('click', fecharModal);
  document.getElementById('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') fecharModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { fecharModal(); fecharNuvem(); }
    if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !/input|select|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault(); abrirModal();
    }
  });
  document.getElementById('rapido-tipo').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) trocarTipoRapido(b.dataset.tipo);
  });
  document.getElementById('form-rapido').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const v = parseValor(f.valor.value);
    if (isNaN(v) || v <= 0) return aviso('Valor inválido');
    const dados = {
      data: f.data.value || isoHoje(),
      tipo: tipoRapido,
      valor: v,
      categoria: f.categoria.value,
      descricao: f.descricao.value.trim(),
    };
    if (tipoRapido === 'renda') {
      const idFonte = document.getElementById('rapido-fonte').value;
      if (idFonte) dados.fonteId = idFonte;
    }
    addLancamento(dados);
    fecharModal();
    aviso('Lançamento salvo');
    renderizarTudo();
  });

  // nuvem
  document.getElementById('btn-nuvem').addEventListener('click', abrirNuvem);
  document.getElementById('nuvem-fechar').addEventListener('click', fecharNuvem);
  document.getElementById('modal-nuvem').addEventListener('click', (e) => { if (e.target.id === 'modal-nuvem') fecharNuvem(); });
  document.getElementById('form-nuvem').addEventListener('submit', async (e) => {
    e.preventDefault();
    const campo = e.target.chave;
    const chave = String(campo.value || '').trim();
    if (!chave) return;
    const botao = document.getElementById('nuvem-entrar');
    botao.disabled = true;
    botao.textContent = 'Conectando…';
    try {
      await nuvemConectar(chave);
      campo.value = '';
      aviso('Nuvem conectada');
    } catch (err) {
      aviso(err.message === 'sessao_expirada' ? 'Sessão expirada, conecte de novo' : 'Não conectou: ' + err.message);
    } finally {
      botao.disabled = false;
      botao.textContent = 'Conectar';
      nuvemPintar();
    }
  });
  document.getElementById('nuvem-sair').addEventListener('click', async () => {
    try { await nuvemChamar('sair', { metodo: 'POST', corpo: {} }); } catch (err) { /* segue local */ }
    try { localStorage.removeItem(CHAVE_TOKEN); } catch (err) { /* ignora */ }
    nuvem.estado = 'local';
    nuvem.erro = null;
    nuvemPintar();
    aviso('Desconectado da nuvem');
  });

  // exportar / importar
  document.getElementById('btn-exportar').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'odorizzi-' + isoHoje() + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    aviso('Backup exportado');
  });

  document.getElementById('btn-importar').addEventListener('click', () => document.getElementById('arquivo-importar').click());
  document.getElementById('arquivo-importar').addEventListener('change', (e) => {
    const arq = e.target.files && e.target.files[0];
    if (!arq) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const lido = JSON.parse(String(leitor.result));
        if (!lido || !Array.isArray(lido.lancamentos)) throw new Error('formato');
        if (!confirm('Substituir todos os dados atuais pelo backup?')) return;
        estado = Object.assign(estadoVazio(), lido);
        salvar();
        aviso('Backup importado');
        renderizarTudo();
      } catch (err) {
        aviso('Arquivo inválido');
      }
    };
    leitor.readAsText(arq);
    e.target.value = '';
  });

  // redesenha o gráfico ao mudar o tamanho
  let t = null;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (!document.getElementById('tela-dashboard').hidden) renderGrafico();
      if (!document.getElementById('tela-calendario').hidden) renderCalendario();
    }, 160);
  });
}

/* ─────────── início ─────────── */

carregar();
ligar();
irPara(abaAtual());

nuvemPintar();
if (nuvemToken()) {
  nuvemSincronizarTudo().catch((e) => {
    if (e.message !== 'sessao_expirada') {
      nuvem.estado = 'erro';
      nuvem.erro = e.message;
      nuvemPintar();
    }
  });
}
window.addEventListener('online', () => { if (nuvemToken()) nuvemEnviar(); });

// expõe pra testes manuais no console
window.odorizzi = { estado: () => estado, salvar, renderizarTudo, nuvem, nuvemEnviar, nuvemSincronizarTudo };
