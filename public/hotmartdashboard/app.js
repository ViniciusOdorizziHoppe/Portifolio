/* Painel de vendas Hotmart — sem dependências */
(() => {
  'use strict';

  const API = '/api/hotmart-dashboard';
  const CHAVE_LOCAL = 'hotmart_dash_key';
  const LIMITE_TABELA = 200;

  const $ = (id) => document.getElementById(id);

  const estado = {
    chave: localStorage.getItem(CHAVE_LOCAL) || '',
    dados: null,
    busca: '',
    periodo: '30'
  };

  /* ---------- utilidades ---------- */

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function dinheiro(valor, moeda) {
    const n = Number(valor) || 0;
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: moeda || 'BRL', maximumFractionDigits: 2
      }).format(n);
    } catch {
      return (moeda || '') + ' ' + n.toFixed(2);
    }
  }

  function numero(n) {
    return new Intl.NumberFormat('pt-BR').format(Number(n) || 0);
  }

  function dataCurta(ms) {
    if (!ms) return '—';
    const d = new Date(ms);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  function dataHora(ms) {
    if (!ms) return '';
    return new Date(ms).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function diaLocal(ms) {
    const d = new Date(ms);
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 10);
  }

  const ROTULO_STATUS = {
    APPROVED: ['Aprovada', 'ok'],
    COMPLETE: ['Completa', 'ok'],
    WAITING_PAYMENT: ['Aguardando', 'espera'],
    PRINTED_BILLET: ['Boleto emitido', 'espera'],
    UNDER_ANALISYS: ['Em análise', 'espera'],
    PROCESSING_TRANSACTION: ['Processando', 'espera'],
    STARTED: ['Iniciada', 'espera'],
    PRE_ORDER: ['Pré-venda', 'espera'],
    REFUNDED: ['Reembolsada', 'ruim'],
    PARTIALLY_REFUNDED: ['Reemb. parcial', 'ruim'],
    CANCELLED: ['Cancelada', 'ruim'],
    CHARGEBACK: ['Chargeback', 'ruim'],
    EXPIRED: ['Expirada', 'ruim'],
    OVERDUE: ['Em atraso', 'ruim'],
    NO_FUNDS: ['Sem fundos', 'ruim'],
    BLOCKED: ['Bloqueada', 'ruim'],
    PROTESTED: ['Protestada', 'ruim']
  };

  function selo(status) {
    const [texto, cls] = ROTULO_STATUS[status] || [status || '—', ''];
    return '<span class="selo ' + cls + '">' + esc(texto) + '</span>';
  }

  const ROTULO_PAGAMENTO = {
    PIX: 'PIX', CREDIT_CARD: 'Cartão', BILLET: 'Boleto', CASH_PAYMENT: 'Dinheiro',
    DIRECT_BANK_TRANSFER: 'Transferência', DIRECT_DEBIT: 'Débito automático',
    FINANCED_BILLET: 'Boleto parcelado', FINANCED_INSTALLMENT: 'Parcelado',
    GOOGLE_PAY: 'Google Pay', SAMSUNG_PAY: 'Samsung Pay', HOTCARD: 'Hotcard',
    HYBRID: 'Híbrido', MANUAL_TRANSFER: 'Transf. manual', PAYPAL: 'PayPal',
    PAYPAL_INTERNACIONAL: 'PayPal int.', PICPAY: 'PicPay', WALLET: 'Carteira'
  };

  /* ---------- portão ---------- */

  function abrirPortao(mensagem) {
    $('painel').hidden = true;
    $('portao').hidden = false;
    $('erro-portao').textContent = mensagem || '';
    if (mensagem) $('chave').value = '';
  }

  function fecharPortao() {
    $('portao').hidden = true;
    $('painel').hidden = false;
  }

  $('form-chave').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const valor = $('chave').value.trim();
    if (!valor) return;
    estado.chave = valor;
    localStorage.setItem(CHAVE_LOCAL, valor);
    $('erro-portao').textContent = '';
    carregar();
  });

  /* ---------- filtros ---------- */

  function janelaAtual() {
    const agora = new Date();
    const escolha = estado.periodo;

    if (escolha === 'mes') {
      const de = new Date(agora.getFullYear(), agora.getMonth(), 1);
      return { de: de.getTime(), ate: agora.getTime() };
    }
    if (escolha === 'mes-passado') {
      const de = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
      const ate = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59);
      return { de: de.getTime(), ate: ate.getTime() };
    }
    if (escolha === 'ano') {
      const de = new Date(agora.getFullYear(), 0, 1);
      return { de: de.getTime(), ate: agora.getTime() };
    }
    if (escolha === 'custom') {
      const deTxt = $('de').value;
      const ateTxt = $('ate').value;
      const de = deTxt ? new Date(deTxt + 'T00:00:00').getTime() : agora.getTime() - 30 * 86400000;
      const ate = ateTxt ? new Date(ateTxt + 'T23:59:59').getTime() : agora.getTime();
      return { de, ate };
    }
    const dias = Number(escolha) || 30;
    return { de: agora.getTime() - dias * 86400000, ate: agora.getTime() };
  }

  $('periodo').addEventListener('change', () => {
    estado.periodo = $('periodo').value;
    const custom = estado.periodo === 'custom';
    $('campo-de').hidden = !custom;
    $('campo-ate').hidden = !custom;
    if (custom && !$('de').value) {
      const hoje = new Date();
      const antes = new Date(hoje.getTime() - 30 * 86400000);
      $('de').value = diaLocal(antes.getTime());
      $('ate').value = diaLocal(hoje.getTime());
    }
    carregar();
  });

  ['de', 'ate', 'status', 'produto'].forEach((id) => {
    $(id).addEventListener('change', carregar);
  });

  $('produto').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') carregar();
  });

  $('btn-atualizar').addEventListener('click', carregar);
  $('btn-tentar').addEventListener('click', carregar);

  $('btn-sair').addEventListener('click', () => {
    localStorage.removeItem(CHAVE_LOCAL);
    estado.chave = '';
    abrirPortao('');
  });

  /* ---------- carregamento ---------- */

  function mostrarEstado(qual, texto) {
    ['estado-carregando', 'estado-erro', 'estado-vazio', 'conteudo'].forEach((id) => {
      $(id).hidden = id !== qual;
    });
    if (texto && qual === 'estado-erro') $('erro-texto').textContent = texto;
  }

  async function carregar() {
    if (!estado.chave) return abrirPortao('');

    const janela = janelaAtual();
    const params = new URLSearchParams({
      de: String(Math.round(janela.de)),
      ate: String(Math.round(janela.ate))
    });
    const status = $('status').value;
    if (status) params.set('status', status);
    const produto = $('produto').value.replace(/\D/g, '');
    if (produto) params.set('produto', produto);

    mostrarEstado('estado-carregando');

    try {
      const r = await fetch(API + '?' + params.toString(), {
        headers: { 'x-dash-key': estado.chave },
        cache: 'no-store'
      });
      const d = await r.json().catch(() => null);

      if (r.status === 401) return abrirPortao('Chave incorreta.');
      if (r.status === 503) return abrirPortao(d && d.dica ? d.dica : 'Painel sem chave configurada no servidor.');
      if (!r.ok || !d || !d.ok) {
        mostrarEstado('estado-erro', (d && (d.dica || d.erro)) || ('HTTP ' + r.status));
        return;
      }

      estado.dados = d;
      fecharPortao();
      desenhar(d);
    } catch (e) {
      mostrarEstado('estado-erro', 'Falha de rede ao falar com o servidor.');
    }
  }

  /* ---------- desenho ---------- */

  function principalMoeda(lista) {
    if (!lista || !lista.length) return null;
    return lista.slice().sort((a, b) => b.valor - a.valor)[0];
  }

  function desenhar(d) {
    const resumo = d.resumo || {};
    const vendas = d.vendas || [];

    const statusTxt = (d.statusConsultados || []).length > 6
      ? 'todos os ' + d.statusConsultados.length + ' status'
      : (d.statusConsultados || []).join(', ');

    $('ambiente').textContent = d.ambiente === 'sandbox' ? 'sandbox' : 'produção';
    $('janela-texto').textContent = dataCurta(d.janela.de) + ' até ' + dataCurta(d.janela.ate)
      + ' · ' + numero(vendas.length) + ' vendas · status: ' + statusTxt;

    const avisos = (d.avisos || []).slice();
    if (resumo.semLiquido) {
      avisos.push(resumo.semLiquido + ' vendas sem líquido calculado: a tarifa veio em moeda diferente do valor.');
    }
    if (avisos.length) {
      $('aviso-api').hidden = false;
      $('aviso-api').textContent = avisos.join(' ');
    } else {
      $('aviso-api').hidden = true;
    }

    if (!vendas.length) return mostrarEstado('estado-vazio');

    desenharKpis(d);
    desenharSerie(resumo.serie, principalMoeda(resumo.bruto));
    desenharBarras($('lista-pagamento'), (resumo.porPagamento || []).map((x) => ({
      nome: ROTULO_PAGAMENTO[x.chave] || x.chave, valor: x.valor
    })));
    desenharBarras($('lista-produtos'), (resumo.porProduto || []).slice(0, 6).map((p) => ({
      nome: p.produto, valor: p.vendas
    })));
    desenharBarras($('lista-status'), (resumo.porStatus || []).map((x) => ({
      nome: (ROTULO_STATUS[x.chave] || [x.chave])[0], valor: x.valor
    })));

    desenharTabela();
    mostrarEstado('conteudo');
  }

  function desenharKpis(d) {
    const resumo = d.resumo || {};
    const vendas = d.vendas || [];
    const bruto = resumo.bruto || [];
    const liquido = resumo.liquido || [];
    const taxas = resumo.taxas || [];
    const principal = principalMoeda(bruto) || { chave: 'BRL', valor: 0 };
    const totalVendas = vendas.length;

    const ticket = totalVendas ? principal.valor / totalVendas : 0;
    const liqPrincipal = (liquido.find((x) => x.chave === principal.chave) || {}).valor || 0;
    const taxaPrincipal = (taxas.find((x) => x.chave === principal.chave) || {}).valor || 0;

    const statusConsultados = d.statusConsultados || [];
    const teveReembolso = statusConsultados.some((s) => s === 'REFUNDED' || s === 'CHARGEBACK' || s === 'PARTIALLY_REFUNDED');
    const reembolsos = vendas.filter((v) => v.status === 'REFUNDED' || v.status === 'CHARGEBACK' || v.status === 'PARTIALLY_REFUNDED').length;
    const taxaReembolso = totalVendas ? (reembolsos / totalVendas) * 100 : 0;

    const outras = bruto.filter((x) => x.chave !== principal.chave);

    const cartao = (rotulo, valorHtml, pe, destaque) => ''
      + '<article class="kpi' + (destaque ? ' destaque' : '') + '">'
      + '<p class="rotulo">' + esc(rotulo) + '</p>'
      + '<p class="numero">' + valorHtml + '</p>'
      + (pe ? '<p class="pe">' + pe + '</p>' : '')
      + '</article>';

    const html = [
      cartao('Faturamento bruto', dinheiro(principal.valor, principal.chave),
        outras.length
          ? 'também ' + outras.map((o) => dinheiro(o.valor, o.chave)).join(' · ')
          : 'valor pago pelo comprador', true),
      cartao('Vendas', numero(totalVendas), 'no período filtrado'),
      cartao('Ticket médio', dinheiro(ticket, principal.chave), principal.chave),
      cartao('Tarifas Hotmart', dinheiro(taxaPrincipal, principal.chave), 'cobradas sobre o valor base'),
      cartao('Líquido estimado', dinheiro(liqPrincipal, principal.chave),
        totalVendas
          ? ((liqPrincipal / (principal.valor || 1)) * 100).toFixed(1).replace('.', ',') + '% do bruto'
          : ''),
      cartao('Reembolso + chargeback',
        teveReembolso ? numero(reembolsos) : '—',
        teveReembolso
          ? taxaReembolso.toFixed(1).replace('.', ',') + '% das vendas'
          : 'não consultado: inclua esses status no filtro')
    ].join('');

    $('kpis').innerHTML = html;
  }

  function desenharSerie(serie, moeda) {
    const alvo = $('grafico-serie');
    if (!serie || !serie.length) {
      alvo.innerHTML = '<p class="nota">sem série no período</p>';
      return;
    }
    const moedaChave = moeda ? moeda.chave : 'BRL';
    const pontos = serie.map((p) => ({
      data: p.data,
      valor: p.valores[moedaChave] || 0
    }));
    const max = Math.max(...pontos.map((p) => p.valor), 1);

    alvo.innerHTML = pontos.map((p) => {
      const altura = Math.max(2, Math.round((p.valor / max) * 160));
      const dia = dataCurta(new Date(p.data + 'T12:00:00').getTime());
      return '<div class="barra-dia" style="height:' + altura + 'px">'
        + '<span class="dica">' + esc(dia) + ' · ' + esc(dinheiro(p.valor, moedaChave)) + '</span></div>';
    }).join('');

    let eixo = $('eixo-serie');
    if (!eixo) {
      eixo = document.createElement('div');
      eixo.id = 'eixo-serie';
      eixo.className = 'eixo';
      alvo.parentNode.appendChild(eixo);
    }
    eixo.innerHTML = '<span>' + esc(dataCurta(new Date(pontos[0].data + 'T12:00:00').getTime()))
      + '</span><span>' + esc(moedaChave) + '</span><span>'
      + esc(dataCurta(new Date(pontos[pontos.length - 1].data + 'T12:00:00').getTime())) + '</span>';
  }

  function desenharBarras(alvo, itens) {
    if (!itens || !itens.length) {
      alvo.innerHTML = '<li class="nota">sem dados</li>';
      return;
    }
    const max = Math.max(...itens.map((i) => i.valor), 1);
    alvo.innerHTML = itens.map((i) => {
      const pct = Math.max(3, Math.round((i.valor / max) * 100));
      return '<li>'
        + '<div class="linha"><span class="nome">' + esc(i.nome) + '</span>'
        + '<span class="qtd">' + numero(i.valor) + '</span></div>'
        + '<div class="trilho"><div class="cheio amarelo" style="width:' + pct + '%"></div></div>'
        + '</li>';
    }).join('');
  }

  function vendasFiltradas() {
    const termo = estado.busca.trim().toLowerCase();
    const todas = (estado.dados && estado.dados.vendas) || [];
    if (!termo) return todas;
    return todas.filter((v) => {
      return (v.comprador || '').toLowerCase().includes(termo)
        || (v.email || '').toLowerCase().includes(termo)
        || (v.transacao || '').toLowerCase().includes(termo)
        || (v.produto || '').toLowerCase().includes(termo);
    });
  }

  function desenharTabela() {
    const vendas = vendasFiltradas();
    const visiveis = vendas.slice(0, LIMITE_TABELA);

    $('corpo-tabela').innerHTML = visiveis.map((v) => {
      const liquido = v.liquido === null
        ? '<span class="nulo">—</span>'
        : dinheiro(v.liquido, v.moeda);
      const origem = v.origem || v.origemSck || '—';
      return '<tr>'
        + '<td title="' + esc(dataHora(v.quando)) + '">' + esc(dataCurta(v.quando)) + '</td>'
        + '<td class="produto">' + esc(v.produto || '—') + '</td>'
        + '<td class="comprador">' + esc(v.comprador || '—')
        + (v.email ? '<small>' + esc(v.email) + '</small>' : '') + '</td>'
        + '<td class="num">' + esc(dinheiro(v.valor, v.moeda)) + '</td>'
        + '<td class="num">' + liquido + '</td>'
        + '<td>' + selo(v.status) + '</td>'
        + '<td>' + esc(ROTULO_PAGAMENTO[v.pagamento] || v.pagamento || '—')
        + (v.parcelas > 1 ? ' <small>' + v.parcelas + 'x</small>' : '') + '</td>'
        + '<td>' + esc(origem) + '</td>'
        + '<td class="transacao">' + esc(v.transacao) + '</td>'
        + '</tr>';
    }).join('') || '<tr><td colspan="9" class="nulo">nenhuma venda com esse termo</td></tr>';

    $('nota-tabela').textContent = vendas.length
      ? 'mostrando ' + numero(visiveis.length) + ' de ' + numero(vendas.length)
      : '';

    const mais = $('mais-registros');
    if (vendas.length > LIMITE_TABELA) {
      mais.hidden = false;
      mais.textContent = 'Mostrando as ' + LIMITE_TABELA + ' mais recentes de '
        + numero(vendas.length) + '. Baixe o CSV para a lista completa.';
    } else {
      mais.hidden = true;
    }
  }

  let temporizadorBusca = null;
  $('busca').addEventListener('input', () => {
    clearTimeout(temporizadorBusca);
    temporizadorBusca = setTimeout(() => {
      estado.busca = $('busca').value;
      desenharTabela();
    }, 140);
  });

  /* ---------- csv ---------- */

  function baixarCsv() {
    const vendas = vendasFiltradas();
    if (!vendas.length) return;

    const colunas = [
      ['data', (v) => (v.quando ? new Date(v.quando).toISOString() : '')],
      ['transacao', (v) => v.transacao],
      ['status', (v) => v.status],
      ['produto', (v) => v.produto],
      ['produto_id', (v) => v.produtoId || ''],
      ['comprador', (v) => v.comprador],
      ['email', (v) => v.email],
      ['valor', (v) => String(v.valor).replace('.', ',')],
      ['moeda', (v) => v.moeda],
      ['liquido', (v) => (v.liquido === null ? '' : String(v.liquido).replace('.', ','))],
      ['tarifa_hotmart', (v) => (v.taxa === null ? '' : String(v.taxa).replace('.', ','))],
      ['moeda_tarifa', (v) => v.moedaTaxa],
      ['pagamento', (v) => v.pagamento],
      ['metodo', (v) => v.metodo],
      ['parcelas', (v) => String(v.parcelas)],
      ['oferta', (v) => v.oferta],
      ['modo_oferta', (v) => v.modoOferta],
      ['assinatura', (v) => (v.assinatura ? 'sim' : 'nao')],
      ['recorrencia', (v) => String(v.recorrencia)],
      ['comissionado_como', (v) => v.comissionadoComo],
      ['origem', (v) => v.origem],
      ['origem_sck', (v) => v.origemSck],
      ['codigo_externo', (v) => v.codigoExterno],
      ['garantia_ate', (v) => (v.garantiaAte ? new Date(v.garantiaAte).toISOString() : '')]
    ];

    const cabecalho = colunas.map((c) => c[0]).join(';');
    const linhas = vendas.map((v) => colunas.map((c) => {
      const bruto = String(c[1](v) == null ? '' : c[1](v));
      return '"' + bruto.replace(/"/g, '""') + '"';
    }).join(';'));

    const csv = '\ufeff' + cabecalho + '\n' + linhas.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hotmart-vendas-' + diaLocal(Date.now()) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $('btn-csv').addEventListener('click', baixarCsv);

  /* ---------- início ---------- */

  if (estado.chave) carregar();
  else abrirPortao('');
})();
