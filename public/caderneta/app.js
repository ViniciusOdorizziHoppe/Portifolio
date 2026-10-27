/* Caderneta — caderno de fiado digital
   App de página única, dados no próprio aparelho (localStorage), funciona offline. */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var toastEl = document.getElementById('toast');
  var KEY = 'caderneta.v1';

  /* ---------------- util ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function brl(cent) {
    return (cent / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function hoje() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISO(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDias(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function diasEntre(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
  function dataCurta(s) { var d = parseISO(s); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); }
  function dataLonga(s) {
    var d = parseISO(s);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  }
  function iniciais(nome) {
    var p = String(nome || '?').trim().split(/\s+/);
    return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }
  function soDigitos(s) { return String(s || '').replace(/\D/g, ''); }
  function zapNum(tel) {
    var d = soDigitos(tel);
    if (!d) return '';
    if (d.length <= 11) d = '55' + d;
    return d;
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('on'); }, 2400);
  }
  function copiar(txt, msg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast(msg); } catch (e) { toast('Não consegui copiar'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt).then(function () { toast(msg); }, fallback);
    } else { fallback(); }
  }

  /* ---------------- estado ---------------- */
  function padrao() {
    return {
      v: 1,
      onb: false,
      loja: { nome: '', cidade: '', chavePix: '', meuZap: '' },
      clientes: [],
      movs: []
    };
  }
  var S = carregar();
  function carregar() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return padrao();
      var o = JSON.parse(raw);
      var base = padrao();
      base.onb = !!o.onb;
      base.loja = Object.assign(base.loja, o.loja || {});
      base.clientes = Array.isArray(o.clientes) ? o.clientes : [];
      base.movs = Array.isArray(o.movs) ? o.movs : [];
      return base;
    } catch (e) { return padrao(); }
  }
  function salvar() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast('Espaço cheio. Faça um backup em Ajustes.'); }
  }

  /* ---------------- cálculos ---------------- */
  function movsDo(id) {
    return S.movs.filter(function (m) { return m.c === id; })
      .sort(function (a, b) { return a.data.localeCompare(b.data) || a.criadoEm - b.criadoEm; });
  }
  // abate os pagamentos do fiado mais antigo primeiro (FIFO)
  function abertos(id) {
    var ms = movsDo(id);
    var pago = 0;
    ms.forEach(function (m) { if (m.t === 'p') pago += m.v; });
    var out = [];
    ms.forEach(function (m) {
      if (m.t !== 'f') return;
      var rem = Math.max(0, m.v - pago);
      pago = Math.max(0, pago - m.v);
      if (rem > 0) out.push({ id: m.id, rem: rem, venc: m.venc || m.data, obs: m.obs || '', data: m.data });
    });
    return out;
  }
  function saldo(id) {
    var s = 0;
    S.movs.forEach(function (m) { if (m.c === id) s += m.t === 'f' ? m.v : -m.v; });
    return Math.max(0, s);
  }
  function atrasoDias(id) {
    var hj = iso(hoje()), max = 0;
    abertos(id).forEach(function (m) {
      if (m.venc < hj) max = Math.max(max, diasEntre(m.venc, hj));
    });
    return max;
  }
  function dadosCliente(id) {
    return S.clientes.filter(function (c) { return c.id === id; })[0] || null;
  }
  function totais() {
    var hj = iso(hoje()), mes = hj.slice(0, 7);
    var receber = 0, atrasado = 0, recebidoMes = 0, devedores = 0, venceHoje = 0;
    var atrasados = [];
    S.clientes.forEach(function (c) {
      var ab = abertos(c.id);
      var s = 0, atras = 0, temVence = false;
      ab.forEach(function (m) {
        s += m.rem;
        if (m.venc < hj) { atrasado += m.rem; atras = Math.max(atras, diasEntre(m.venc, hj)); }
        if (m.venc === hj) { venceHoje += m.rem; temVence = true; }
      });
      receber += s;
      if (s > 0) devedores++;
      if (atras > 0) atrasados.push({ c: c, saldo: s, atras: atras });
    });
    S.movs.forEach(function (m) {
      if (m.t === 'p' && m.data.slice(0, 7) === mes) recebidoMes += m.v;
    });
    atrasados.sort(function (a, b) { return b.atras - a.atras || b.saldo - a.saldo; });
    return { receber: receber, atrasado: atrasado, recebidoMes: recebidoMes, devedores: devedores, venceHoje: venceHoje, atrasados: atrasados };
  }

  /* ---------------- ícones ---------------- */
  var IC = {
    hoje: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.4 12 3l9 7.4"/><path d="M5.5 9.4V21h13V9.4"/><path d="M10 21v-5.5h4V21"/></svg>',
    clientes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.3"/><path d="M2.6 20c0-3.5 2.9-5.9 6.4-5.9s6.4 2.4 6.4 5.9"/><path d="M17 5.2a3.1 3.1 0 0 1 0 5.9"/><path d="M18.4 20c0-2.4-.9-4.2-2.4-5.1"/></svg>',
    ajustes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h9"/><path d="M17.5 7H20"/><path d="M4 17h3"/><path d="M11.5 17H20"/><circle cx="15" cy="7" r="2.3"/><circle cx="9" cy="17" r="2.3"/></svg>'
  };

  function topo() {
    return '<div class="topbar">' +
      '<div class="marca"><span class="ponto">C</span><div>Caderneta<small>' + esc(S.loja.nome || 'minha loja') + '</small></div></div>' +
      '<button data-acao="nav" data-v="ajustes" aria-label="Ajustes" style="background:none;border:0;padding:6px;color:var(--ink-2)">' +
      '<span style="display:block;width:22px;height:22px">' + IC.ajustes + '</span></button>' +
      '</div>';
  }

  function nav(v) {
    function b(id, label, icon) {
      return '<button data-acao="nav" data-v="' + id + '"' + (v === id ? ' aria-current="page"' : '') + '>' +
        icon + '<span>' + label + '</span></button>';
    }
    return '<nav class="nav"><div class="nav-in">' +
      b('hoje', 'Hoje', IC.hoje) + b('clientes', 'Clientes', IC.clientes) + b('ajustes', 'Ajustes', IC.ajustes) +
      '</div></nav>' +
      (v === 'novo' || v === 'receber' || v === 'cobrar' || v === 'cliente' ? '' : '<button class="fab" data-acao="novo" aria-label="Anotar fiado">+</button>');
  }

  /* ---------------- rotas ---------------- */
  function rota() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var partes = h.split('/');
    return { v: partes[0] || 'hoje', id: partes[1] || null };
  }
  function ir(para) { location.hash = '#/' + para; }

  var draft = { clienteId: null, nome: '', cent: 0, venc: '', obs: '' };
  function novoDraft(clienteId) {
    var c = clienteId ? dadosCliente(clienteId) : null;
    draft = {
      clienteId: c ? c.id : null,
      nome: c ? c.nome : '',
      cent: 0,
      venc: iso(addDias(hoje(), 30)),
      obs: ''
    };
  }

  /* ---------------- views ---------------- */
  function viewOnb() {
    var l = S.loja;
    return '<div class="onb">' +
      '<img class="onb-selo" src="icone-192.png" alt="Caderneta" width="62" height="62">' +
      '<h1>O caderno de fiado<br>do seu comércio</h1>' +
      '<p class="lead">Anote em 3 toques, saiba quem te deve e cobre pelo WhatsApp com o PIX pronto. Tudo fica no seu celular.</p>' +
      '<div class="campo"><label for="o-loja">Nome da loja ou do seu negócio</label>' +
      '<input id="o-loja" type="text" placeholder="Mercado São Jorge" value="' + esc(l.nome) + '" autocomplete="off"></div>' +
      '<div class="campo"><label for="o-cidade">Cidade</label>' +
      '<input id="o-cidade" type="text" placeholder="Presidente Getúlio" value="' + esc(l.cidade) + '" autocomplete="off"></div>' +
      '<div class="campo"><label for="o-pix">Sua chave PIX <span style="text-transform:none;color:var(--ink-3);font-weight:500">(pode deixar pra depois)</span></label>' +
      '<input id="o-pix" type="text" placeholder="CPF, celular, e-mail ou aleatória" value="' + esc(l.chavePix) + '" autocomplete="off"></div>' +
      '<button class="btn primario" data-acao="onb-salvar">Começar minha caderneta</button>' +
      '<p class="rodape-nota">Sem cadastro, sem mensalidade de teste. Seus dados não saem do aparelho.</p>' +
      '</div>';
  }

  function viewHoje() {
    var t = totais();
    var hj = iso(hoje());
    var paraCobrar = t.atrasados.slice(0, 6);
    var h = topo();

    h += '<h1 class="h-title">Hoje</h1>';
    h += '<p class="h-sub">' + hoje().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) + '</p>';

    if (!S.clientes.length) {
      h += '<div class="card vazio"><div class="emoji">📒</div>' +
        '<h3>Sua caderneta está limpa</h3>' +
        '<p>Na próxima venda fiada, toque no <b>+</b> e anote. Depois é só olhar aqui pra saber quem te deve.</p>' +
        '<button class="btn primario" data-acao="novo">Anotar o primeiro fiado</button></div>';
      return h;
    }

    h += '<div class="card total-card">' +
      '<div class="total-label">A receber</div>' +
      '<div class="total-valor">' + brl(t.receber) + '</div>' +
      '<div class="total-meta">' + (t.devedores === 1 ? '1 cliente devendo' : t.devedores + ' clientes devendo') + '</div>' +
      '</div>';

    h += '<div class="duplas">' +
      '<div class="mini red"><span>Atrasado</span><strong>' + brl(t.atrasado) + '</strong></div>' +
      '<div class="mini green"><span>Recebido no mês</span><strong>' + brl(t.recebidoMes) + '</strong></div>' +
      '</div>';

    if (t.atrasado > 0) {
      var n = t.atrasados.length;
      h += '<button class="alerta" data-acao="nav" data-v="clientes">' +
        '<span><b>' + brl(t.atrasado) + ' atrasado</b><span>' + (n === 1 ? '1 cliente' : n + ' clientes') + ' · toque para cobrar</span></span>' +
        '<span class="seta">→</span></button>';
    }

    var jaListados = {};
    if (t.venceHoje > 0) {
      h += '<div class="sec-head"><h2>Vence hoje</h2></div><div class="lista">';
      S.clientes.forEach(function (c) {
        var venc = 0;
        abertos(c.id).forEach(function (m) { if (m.venc === hj) venc += m.rem; });
        if (!venc) return;
        jaListados[c.id] = true;
        h += linhaCliente(c, venc, 0, true);
      });
      h += '</div>';
    }

    paraCobrar = paraCobrar.filter(function (x) { return !jaListados[x.c.id]; });
    if (paraCobrar.length) {
      h += '<div class="sec-head"><h2>Mais atrasados</h2><button data-acao="nav" data-v="clientes">ver todos</button></div><div class="lista">';
      paraCobrar.forEach(function (x) { h += linhaCliente(x.c, x.saldo, x.atras); });
      h += '</div>';
    }

    if (t.receber === 0) {
      h += '<div class="card vazio" style="margin-top:16px"><div class="emoji">✅</div>' +
        '<h3>Ninguém te devendo</h3><p>Tudo em dia. Quando vender fiado, anote aqui.</p></div>';
    }

    return h;
  }

  function linhaCliente(c, valor, atras, venceHoje) {
    var det = [];
    if (atras > 0) det.push('atrasado ' + atras + (atras === 1 ? ' dia' : ' dias'));
    else if (venceHoje) det.push('vence hoje');
    else det.push('em dia');
    if (c.tel) det.push(c.tel);
    return '<button class="linha" data-acao="cliente" data-id="' + c.id + '">' +
      '<span class="avatar">' + esc(iniciais(c.nome)) + '</span>' +
      '<span class="quem"><span class="nome">' + esc(c.nome) + '</span>' +
      '<span class="det">' + esc(det.join(' · ')) + '</span></span>' +
      '<span class="valor' + (atras > 0 ? '' : ' ok') + '">' + brl(valor) +
      '</span>' +
      '</button>';
  }

  function viewClientes() {
    var h = topo();
    var t = totais();
    var devedores = [], quites = [];
    S.clientes.forEach(function (c) {
      var s = saldo(c.id);
      if (s > 0) devedores.push({ c: c, s: s, atras: atrasoDias(c.id) });
      else quites.push(c);
    });
    devedores.sort(function (a, b) { return b.atras - a.atras || b.s - a.s; });
    quites.sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });

    h += '<h1 class="h-title">Clientes</h1>';
    h += '<p class="h-sub">' + brl(t.receber) + ' a receber de ' + devedores.length + (devedores.length === 1 ? ' pessoa' : ' pessoas') + '</p>';

    h += '<div class="campo" style="margin-bottom:12px">' +
      '<input id="busca" type="text" placeholder="Buscar cliente..." autocomplete="off" style="padding:12px 14px">' +
      '</div>';

    if (!S.clientes.length) {
      h += '<div class="card vazio"><div class="emoji">🧾</div><h3>Nenhum cliente ainda</h3>' +
        '<p>Os clientes aparecem aqui quando você anota o primeiro fiado.</p>' +
        '<button class="btn primario" data-acao="novo">Anotar fiado</button></div>';
      return h;
    }

    h += '<div class="lista" id="lista-clientes" data-estado="divida">';
    devedores.forEach(function (x) {
      h += '<div data-nome="' + esc(x.c.nome.toLowerCase()) + '">' + linhaCliente(x.c, x.s, x.atras) + '</div>';
    });
    h += '</div>';

    if (quites.length) {
      h += '<div class="sec-head"><h2>Sem dívida (' + quites.length + ')</h2></div><div class="lista">';
      quites.forEach(function (c) {
        h += '<div data-nome="' + esc(c.nome.toLowerCase()) + '"><button class="linha" data-acao="cliente" data-id="' + c.id + '">' +
          '<span class="avatar">' + esc(iniciais(c.nome)) + '</span>' +
          '<span class="quem"><span class="nome">' + esc(c.nome) + '</span><span class="det">conta zerada</span></span>' +
          '<span class="valor ok"><small style="color:var(--green)">em dia</small></span></button></div>';
      });
      h += '</div>';
    }

    return h;
  }

  function viewCliente(id) {
    var c = dadosCliente(id);
    if (!c) return topo() + '<div class="card vazio"><h3>Cliente não encontrado</h3>' +
      '<button class="btn" data-acao="nav" data-v="clientes">Voltar</button></div>';

    var s = saldo(id), atras = atrasoDias(id);
    var ms = movsDo(id).slice().reverse();
    var h = topo();

    h += '<div class="cliente-topo">' +
      '<div class="avatar">' + esc(iniciais(c.nome)) + '</div>' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:20px;font-weight:700;letter-spacing:-.02em;overflow:hidden;text-overflow:ellipsis">' + esc(c.nome) + '</div>' +
      '<div style="font-size:13px;color:var(--ink-3)">' + (c.tel ? esc(c.tel) : 'sem telefone') + '</div>' +
      '</div>' +
      '<button data-acao="editar-cliente" data-id="' + c.id + '" aria-label="Editar cliente" ' +
      'style="background:none;border:0;font-size:20px;color:var(--ink-3);padding:4px 6px">⋯</button>' +
      '</div>';

    h += '<div class="card total-card" style="margin-top:12px">' +
      '<div class="total-label">' + (s > 0 ? 'Saldo devedor' : 'Sem dívida') + '</div>' +
      '<div class="total-valor">' + brl(s) + '</div>' +
      '<div class="total-meta">' + (s > 0 ? (atras > 0 ? 'atrasado há ' + atras + (atras === 1 ? ' dia' : ' dias') : 'em dia') : 'pode vender fiado de novo') + '</div>' +
      '</div>';

    if (s > 0) {
      h += '<div style="margin-top:12px"><button class="btn primario" data-acao="cobrar" data-id="' + c.id + '">📲 Cobrar no WhatsApp</button></div>';
      h += '<div class="btn-linha" style="margin-top:10px">' +
        '<button class="btn escuro" data-acao="receber" data-id="' + c.id + '">Recebi</button>' +
        '<button class="btn" data-acao="novo" data-cliente="' + c.id + '">Novo fiado</button></div>';
    } else {
      h += '<div style="margin-top:12px"><button class="btn primario" data-acao="novo" data-cliente="' + c.id + '">Anotar fiado</button></div>';
    }

    h += '<div class="sec-head"><h2>Histórico</h2><span style="font-size:12px;color:var(--ink-3)">' + ms.length + ' lançamentos</span></div>';
    h += '<div class="card" style="padding:4px 16px">';
    if (!ms.length) {
      h += '<p style="color:var(--ink-3);font-size:14px;padding:12px 0">Nada lançado ainda.</p>';
    } else {
      ms.forEach(function (m) {
        var fiado = m.t === 'f';
        h += '<div class="mov" data-acao="mov" data-id="' + m.id + '">' +
          '<span class="ic ' + (fiado ? 'f' : 'p') + '">' + (fiado ? '↑' : '↓') + '</span>' +
          '<span class="txt"><b>' + (fiado ? 'Fiado' : 'Pagamento') + (m.forma ? ' · ' + esc(m.forma) : '') + '</b>' +
          '<span>' + dataCurta(m.data) + (fiado && m.venc ? ' · vence ' + dataCurta(m.venc) : '') +
          (m.obs ? ' · ' + esc(m.obs) : '') + '</span></span>' +
          '<span class="v ' + (fiado ? 'f' : 'p') + '">' + (fiado ? '+' : '−') + ' ' + brl(m.v) + '</span>' +
          '</div>';
      });
    }
    h += '</div>';

    return h;
  }

  function viewNovo() {
    var h = topo();
    h += '<h1 class="h-title">Anotar fiado</h1>';
    h += '<p class="h-sub">O nome, o valor e o dia de pagar. Só isso.</p>';

    h += '<div class="campo"><label for="f-cliente">Cliente</label>' +
      '<input id="f-cliente" type="text" placeholder="Nome do cliente" autocomplete="off" value="' + esc(draft.nome) + '"' +
      (draft.clienteId ? ' readonly style="background:#efeade"' : '') + '>' +
      '<div id="sug" class="pills" style="margin-top:8px"></div></div>';

    h += '<div class="campo"><label for="f-valor">Valor</label>' +
      '<input id="f-valor" class="money num" type="text" inputmode="numeric" placeholder="R$ 0,00" value="' +
      (draft.cent ? (draft.cent / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '') + '"></div>';

    h += '<div class="campo"><label>Vence em</label><div class="pills" id="venc-pills">' +
      pillVenc('Hoje', iso(hoje())) +
      pillVenc('7 dias', iso(addDias(hoje(), 7))) +
      pillVenc('15 dias', iso(addDias(hoje(), 15))) +
      pillVenc('30 dias', iso(addDias(hoje(), 30))) +
      '</div>' +
      '<div style="margin-top:10px"><input id="f-venc" type="date" value="' + draft.venc + '" style="width:100%;background:var(--card);border:1px solid var(--line-2);border-radius:11px;padding:12px 14px"></div>' +
      '</div>';

    h += '<div class="campo"><label for="f-obs">Observação <span style="text-transform:none;color:var(--ink-3);font-weight:500">(opcional)</span></label>' +
      '<input id="f-obs" type="text" placeholder="ex: 2 camisetas, pagar no dia 10" value="' + esc(draft.obs) + '"></div>';

    h += '<button class="btn primario" data-acao="salvar-fiado">Anotar fiado</button>';
    return h;
  }

  function pillVenc(label, data) {
    var on = draft.venc === data;
    return '<button class="pill" type="button" data-acao="venc" data-data="' + data + '" aria-pressed="' + on + '">' + label + '</button>';
  }

  function viewReceber(id) {
    var c = dadosCliente(id);
    if (!c) return topo() + '<button class="btn" data-acao="nav" data-v="clientes">Voltar</button>';
    var s = saldo(id);
    var h = topo();
    h += '<h1 class="h-title">Receber de ' + esc(c.nome.split(' ')[0]) + '</h1>';
    h += '<p class="h-sub">Saldo devedor: <b>' + brl(s) + '</b></p>';

    h += '<div class="campo"><label for="r-valor">Valor recebido</label>' +
      '<input id="r-valor" class="money num" type="text" inputmode="numeric" value="' + (s / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '"></div>';

    h += '<div class="campo"><label>Como pagou</label><div class="pills" id="forma-pills">' +
      ['PIX', 'Dinheiro', 'Cartão', 'Outro'].map(function (f, i) {
        return '<button class="pill" type="button" data-acao="forma" data-forma="' + f + '" aria-pressed="' + (i === 0) + '">' + f + '</button>';
      }).join('') + '</div></div>';

    h += '<button class="btn primario" data-acao="salvar-recebimento" data-id="' + id + '">Confirmar recebimento</button>';
    h += '<p class="rodape-nota" style="margin-top:12px">Se recebeu só uma parte, é só mudar o valor. O resto continua em aberto.</p>';
    return h;
  }

  var formaAtual = 'PIX';

  function mensagem(id, tom) {
    var c = dadosCliente(id), s = saldo(id), atras = atrasoDias(id);
    var nome = c.nome.split(' ')[0];
    var loja = S.loja.nome || 'nossa loja';
    if (tom === 'vencido') {
      return 'Oi ' + nome + '! Seu saldo na ' + loja + ' está em ' + brl(s) +
        (atras > 0 ? ', com ' + atras + (atras === 1 ? ' dia' : ' dias') + ' de atraso' : '') +
        '. Consegue acertar essa semana? Se quiser, mando o PIX aqui.';
    }
    if (tom === 'firme') {
      return nome + ', seu débito de ' + brl(s) + ' na ' + loja + ' está pendente há ' + atras +
        ' dias. Preciso que a gente resolva essa semana. Pode ser hoje?';
    }
    return 'Oi ' + nome + ', tudo bem? Passando pra lembrar do valor de ' + brl(s) +
      ' que ficou em aberto na ' + loja + '. Quando puder, me avisa que a gente acerta.';
  }

  var tomAtual = 'lembrete';

  function viewCobrar(id) {
    var c = dadosCliente(id);
    if (!c) return topo() + '<button class="btn" data-acao="nav" data-v="clientes">Voltar</button>';
    var s = saldo(id), atras = atrasoDias(id);
    if (atras > 0 && tomAtual === 'lembrete') tomAtual = 'vencido';
    var msg = mensagem(id, tomAtual);
    var h = topo();

    h += '<h1 class="h-title">Cobrar ' + esc(c.nome.split(' ')[0]) + '</h1>';
    h += '<p class="h-sub">Saldo de ' + brl(s) + (atras > 0 ? ' · ' + atras + ' dias de atraso' : '') + '</p>';

    h += '<div class="campo"><label>Tom da mensagem</label><div class="pills">' +
      [['lembrete', 'Lembrete'], ['vencido', 'Vencido'], ['firme', 'Firme']].map(function (p) {
        return '<button class="pill" data-acao="tom" data-tom="' + p[0] + '" aria-pressed="' + (tomAtual === p[0]) + '">' + p[1] + '</button>';
      }).join('') + '</div></div>';

    h += '<div class="campo"><label for="c-msg">Mensagem</label>' +
      '<textarea id="c-msg" style="min-height:110px">' + esc(msg) + '</textarea></div>';

    h += '<button class="btn escuro" data-acao="enviar-zap" data-id="' + id + '">Abrir WhatsApp</button>';
    h += '<button class="btn ghost" data-acao="copiar-msg">Copiar mensagem</button>';

    if (S.loja.chavePix) {
      h += '<div class="sec-head"><h2>PIX de ' + brl(s) + '</h2></div>';
      h += '<div class="card pix-box">' +
        '<div class="pix-qr" id="qr"></div>' +
        '<button class="btn primario" data-acao="copiar-pix" data-id="' + id + '">Copiar PIX copia e cola</button>' +
        '<p class="dica" style="font-size:12px;color:var(--ink-3);margin:8px 0 0">Cole no WhatsApp junto com a mensagem. O valor já vai preenchido.</p>' +
        '</div>';
    } else {
      h += '<div class="card" style="margin-top:14px"><p style="margin:0 0 10px;font-size:14px;color:var(--ink-2)">' +
        'Configure sua chave PIX para mandar a cobrança já com o valor e o QR pronto.</p>' +
        '<button class="btn ghost" data-acao="nav" data-v="ajustes">Configurar chave PIX</button></div>';
    }

    return h;
  }

  function viewAjustes() {
    var l = S.loja;
    var h = topo();
    h += '<h1 class="h-title">Ajustes</h1>';
    h += '<p class="h-sub">Seus dados ficam só neste aparelho.</p>';

    h += '<div class="card">' +
      '<div class="campo"><label for="a-loja">Nome da loja</label><input id="a-loja" type="text" value="' + esc(l.nome) + '"></div>' +
      '<div class="campo"><label for="a-cidade">Cidade</label><input id="a-cidade" type="text" value="' + esc(l.cidade) + '"></div>' +
      '<div class="campo"><label for="a-pix">Chave PIX</label><input id="a-pix" type="text" value="' + esc(l.chavePix) + '" placeholder="CPF, celular, e-mail ou aleatória">' +
      '<div class="dica">Usada para gerar o QR e o copia e cola da cobrança.</div></div>' +
      '<div class="campo"><label for="a-zap">Seu WhatsApp</label><input id="a-zap" type="tel" value="' + esc(l.meuZap || '') + '" placeholder="(47) 99999-9999"></div>' +
      '<button class="btn primario" data-acao="salvar-ajustes">Salvar</button>' +
      '</div>';

    h += '<div class="sec-head"><h2>Dados</h2></div>';
    h += '<div class="card" style="padding:6px 16px"><div class="lista-ajustes">' +
      '<button class="ajuste" data-acao="backup">💾 Fazer backup<span class="seta">→</span></button>' +
      '<button class="ajuste" data-acao="restaurar">📥 Restaurar backup<span class="seta">→</span></button>' +
      '<button class="ajuste" data-acao="nav" data-v="importar">✍️ Trazer do caderno de papel<span class="seta">→</span></button>' +
      '<button class="ajuste" data-acao="zerar" style="color:var(--red)">🗑 Apagar todos os dados<span class="seta">→</span></button>' +
      '</div></div>';

    h += '<p class="rodape-nota">Caderneta · versão 1.0<br>' +
      S.clientes.length + ' clientes · ' + S.movs.length + ' lançamentos<br>' +
      'Funciona sem internet. Os dados ficam no seu aparelho: faça backup de vez em quando.</p>';
    return h;
  }

  function viewImportar() {
    var h = topo();
    h += '<h1 class="h-title">Trazer do papel</h1>';
    h += '<p class="h-sub">Cole a lista do seu caderno, um cliente por linha: nome e valor.</p>';
    h += '<div class="campo"><label for="i-txt">Sua lista</label>' +
      '<textarea id="i-txt" placeholder="Zé da padaria 150,00&#10;Maria 80&#10;Seu Antônio 320,50 vence 10/12" style="min-height:170px;font-family:ui-monospace,monospace;font-size:14px"></textarea>' +
      '<div class="dica">Funciona com vírgula ou ponto no valor. Se tiver uma data, ela vira o vencimento.</div></div>';
    h += '<button class="btn primario" data-acao="importar-texto">Revisar e importar</button>';
    return h;
  }

  /* ---------------- sheets ---------------- */
  function abrirSheet(html) {
    fecharSheet();
    var bg = document.createElement('div');
    bg.className = 'sheet-bg';
    bg.id = 'sheet-bg';
    bg.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' +
      '<button class="btn ghost fechar" data-acao="fechar-sheet" style="width:auto;padding:8px 12px;font-size:13px">Fechar</button>' +
      html + '</div>';
    document.body.appendChild(bg);
    bg.addEventListener('click', function (e) { if (e.target === bg) fecharSheet(); });
    return bg;
  }
  function fecharSheet() {
    var b = document.getElementById('sheet-bg');
    if (b) b.remove();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharSheet(); });

  /* ---------------- render ---------------- */
  function render() {
    if (!S.onb) {
      app.innerHTML = viewOnb();
      depoisRender();
      return;
    }
    var r = rota();
    var html;
    switch (r.v) {
      case 'clientes': html = viewClientes(); break;
      case 'cliente': html = viewCliente(r.id); break;
      case 'novo': html = viewNovo(); break;
      case 'receber': html = viewReceber(r.id); break;
      case 'cobrar': html = viewCobrar(r.id); break;
      case 'ajustes': html = viewAjustes(); break;
      case 'importar': html = viewImportar(); break;
      default: html = viewHoje(); r.v = 'hoje';
    }
    app.innerHTML = html + nav(r.v);
    depoisRender();
    window.scrollTo(0, 0);
  }

  function depoisRender() {
    // máscara de dinheiro
    document.querySelectorAll('input.money').forEach(function (el) {
      el.addEventListener('input', function () {
        var d = el.value.replace(/\D/g, '').slice(0, 10);
        el.value = d ? (Number(d) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
      });
      el.addEventListener('focus', function () { setTimeout(function () { el.select(); }, 30); });
    });

    // sugestões de cliente no novo fiado
    var fc = document.getElementById('f-cliente');
    if (fc && !fc.readOnly) {
      fc.addEventListener('input', function () { draft.nome = fc.value; draft.clienteId = null; sugerir(); });
      sugerir();
    }

    // busca de clientes
    var busca = document.getElementById('busca');
    if (busca) {
      busca.addEventListener('input', function () {
        var q = busca.value.trim().toLowerCase();
        document.querySelectorAll('[data-nome]').forEach(function (w) {
          var n = w.getAttribute('data-nome');
          if (n == null) return;
          w.style.display = (!q || n.indexOf(q) >= 0) ? '' : 'none';
        });
      });
    }

    // QR do PIX na tela de cobrar
    var qrEl = document.getElementById('qr');
    if (qrEl) {
      var r = rota();
      try {
        var payload = Pix.brcode({
          chave: S.loja.chavePix,
          nome: S.loja.nome || 'RECEBEDOR',
          cidade: S.loja.cidade || 'BRASIL',
          valor: saldo(r.id) / 100,
          txid: 'CAD' + String(Date.now()).slice(-10)
        });
        qrEl.innerHTML = qrHtml(payload);
        qrEl.setAttribute('data-payload', payload);
      } catch (e) {
        qrEl.innerHTML = '<p style="font-size:12px;color:var(--red);padding:10px">Chave PIX inválida</p>';
      }
    }
  }

  function qrHtml(texto) {
    try {
      var qr = qrcode(0, 'M');
      qr.addData(texto);
      qr.make();
      return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } catch (e) {
      try {
        var q2 = qrcode(0, 'M');
        q2.addData(texto);
        q2.make();
        return '<img alt="QR Code PIX" src="' + q2.createDataURL(6, 0) + '">';
      } catch (e2) {
        return '<p style="font-size:12px;color:var(--red);padding:10px">Não consegui gerar o QR</p>';
      }
    }
  }

  function sugerir() {
    var box = document.getElementById('sug');
    if (!box) return;
    var q = (draft.nome || '').trim().toLowerCase();
    var achados = S.clientes.filter(function (c) {
      return q && c.nome.toLowerCase().indexOf(q) >= 0 && c.id !== draft.clienteId;
    }).slice(0, 4);
    if (!q || !achados.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<span style="font-size:12px;color:var(--ink-3);width:100%">Já está na caderneta:</span>' +
      achados.map(function (c) {
        return '<button class="pill" type="button" data-acao="escolher" data-id="' + c.id + '">' + esc(c.nome) + '</button>';
      }).join('');
  }

  /* ---------------- ações ---------------- */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-acao]');
    if (!el) return;
    var acao = el.getAttribute('data-acao');
    var id = el.getAttribute('data-id');

    switch (acao) {
      case 'nav':
        fecharSheet();
        ir(el.getAttribute('data-v'));
        break;

      case 'novo':
        novoDraft(el.getAttribute('data-cliente'));
        ir('novo');
        break;

      case 'cliente':
        ir('cliente/' + id);
        break;

      case 'receber':
        formaAtual = 'PIX';
        ir('receber/' + id);
        break;

      case 'cobrar':
        tomAtual = atrasoDias(id) > 0 ? 'vencido' : 'lembrete';
        ir('cobrar/' + id);
        break;

      case 'fechar-sheet':
        fecharSheet();
        break;

      case 'onb-salvar': {
        var nome = ($('#o-loja') || {}).value || '';
        if (!nome.trim()) { toast('Digite o nome do seu negócio'); return; }
        S.loja.nome = nome.trim();
        S.loja.cidade = (($('#o-cidade') || {}).value || '').trim();
        S.loja.chavePix = (($('#o-pix') || {}).value || '').trim();
        S.onb = true;
        salvar();
        toast('Caderneta pronta');
        ir('hoje');
        render();
        break;
      }

      case 'escolher': {
        var c = dadosCliente(id);
        if (!c) return;
        draft.clienteId = c.id;
        draft.nome = c.nome;
        render();
        break;
      }

      case 'venc': {
        draft.venc = el.getAttribute('data-data');
        document.querySelectorAll('#venc-pills .pill').forEach(function (p) {
          p.setAttribute('aria-pressed', p === el ? 'true' : 'false');
        });
        var fv = document.getElementById('f-venc');
        if (fv) fv.value = draft.venc;
        break;
      }

      case 'forma': {
        formaAtual = el.getAttribute('data-forma');
        document.querySelectorAll('#forma-pills .pill').forEach(function (p) {
          p.setAttribute('aria-pressed', p === el ? 'true' : 'false');
        });
        break;
      }

      case 'tom': {
        tomAtual = el.getAttribute('data-tom');
        var ta = document.getElementById('c-msg');
        if (ta) ta.value = mensagem(rota().id, tomAtual);
        document.querySelectorAll('[data-acao="tom"]').forEach(function (p) {
          p.setAttribute('aria-pressed', p === el ? 'true' : 'false');
        });
        break;
      }

      case 'salvar-fiado': {
        var nomeF = (($('#f-cliente') || {}).value || '').trim();
        var valorF = centavos($('#f-valor'));
        var venc = (($('#f-venc') || {}).value || draft.venc || '').trim();
        var obsF = (($('#f-obs') || {}).value || '').trim();
        if (!nomeF) { toast('Falta o nome do cliente'); return; }
        if (!valorF) { toast('Falta o valor do fiado'); return; }
        if (!venc) venc = iso(addDias(hoje(), 30));

        var cliente = draft.clienteId ? dadosCliente(draft.clienteId) : null;
        if (!cliente) {
          cliente = S.clientes.filter(function (x) { return x.nome.toLowerCase() === nomeF.toLowerCase(); })[0];
        }
        if (!cliente) {
          cliente = { id: uid(), nome: nomeF, tel: '', criadoEm: Date.now() };
          S.clientes.push(cliente);
        }
        S.movs.push({
          id: uid(), c: cliente.id, t: 'f', v: valorF,
          data: iso(hoje()), venc: venc, obs: obsF, criadoEm: Date.now()
        });
        salvar();
        toast('Fiado anotado: ' + brl(valorF));
        novoDraft(null);
        ir('cliente/' + cliente.id);
        render();
        break;
      }

      case 'salvar-recebimento': {
        var valorR = centavos($('#r-valor'));
        if (!valorR) { toast('Digite o valor recebido'); return; }
        S.movs.push({
          id: uid(), c: id, t: 'p', v: valorR,
          data: iso(hoje()), forma: formaAtual, criadoEm: Date.now()
        });
        salvar();
        toast('Recebido ' + brl(valorR));
        ir('cliente/' + id);
        render();
        break;
      }

      case 'copiar-pix': {
        var qr = document.getElementById('qr');
        var payload = qr && qr.getAttribute('data-payload');
        if (!payload) { toast('Configure a chave PIX primeiro'); return; }
        copiar(payload, 'PIX copiado');
        break;
      }

      case 'copiar-msg': {
        var tm = document.getElementById('c-msg');
        copiar(tm ? tm.value : '', 'Mensagem copiada');
        break;
      }

      case 'enviar-zap': {
        var c2 = dadosCliente(id);
        var num = zapNum(c2.tel);
        var texto = (($('#c-msg') || {}).value || '').trim();
        if (!num) {
          editarCliente(id, 'Para mandar no WhatsApp preciso do telefone do cliente.');
          return;
        }
        window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
        break;
      }

      case 'editar-cliente':
        editarCliente(id);
        break;

      case 'mov':
        abrirSheet('<h3>Lançamento</h3><p style="color:var(--ink-2);font-size:14px">Se anotou errado, pode apagar. O saldo se ajusta sozinho.</p>' +
          '<button class="btn perigo" data-acao="apagar-mov" data-id="' + id + '">Apagar este lançamento</button>');
        break;

      case 'apagar-mov':
        S.movs = S.movs.filter(function (m) { return m.id !== id; });
        salvar();
        fecharSheet();
        toast('Lançamento apagado');
        render();
        break;

      case 'salvar-ajustes': {
        S.loja.nome = (($('#a-loja') || {}).value || '').trim() || S.loja.nome;
        S.loja.cidade = (($('#a-cidade') || {}).value || '').trim();
        S.loja.chavePix = (($('#a-pix') || {}).value || '').trim();
        S.loja.meuZap = (($('#a-zap') || {}).value || '').trim();
        salvar();
        toast('Ajustes salvos');
        ir('hoje');
        render();
        break;
      }

      case 'backup': {
        var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'caderneta-' + iso(hoje()) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast('Backup salvo');
        break;
      }

      case 'restaurar': {
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'application/json';
        inp.onchange = function () {
          var f = inp.files && inp.files[0];
          if (!f) return;
          var fr = new FileReader();
          fr.onload = function () {
            try {
              var o = JSON.parse(String(fr.result));
              if (!o || !Array.isArray(o.clientes)) throw new Error('formato');
              if (!confirm('Substituir os dados atuais pelo backup?')) return;
              S = Object.assign(padrao(), o);
              S.onb = true;
              salvar();
              toast('Backup restaurado');
              ir('hoje');
              render();
            } catch (e) { alert('Arquivo inválido.'); }
          };
          fr.readAsText(f);
        };
        inp.click();
        break;
      }

      case 'zerar':
        abrirSheet('<h3>Apagar tudo</h3><p style="color:var(--ink-2);font-size:14px">Isso apaga clientes e lançamentos deste aparelho. Faça um backup antes.</p>' +
          '<button class="btn perigo" data-acao="zerar2">Apagar definitivamente</button>');
        break;

      case 'zerar2':
        S = padrao();
        S.onb = false;
        localStorage.removeItem(KEY);
        fecharSheet();
        render();
        toast('Dados apagados');
        break;

      case 'importar-texto': {
        var txt = (($('#i-txt') || {}).value || '');
        var linhas = txt.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean);
        var previa = [];
        linhas.forEach(function (l) {
          // tira a data primeiro, senao "10/12" vira valor
          var dm = l.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
          var semData = dm ? (l.slice(0, dm.index) + ' ' + l.slice(dm.index + dm[0].length)) : l;
          // pega o ultimo numero da linha, esteja onde estiver
          var re = /\d{1,3}(?:\.\d{3})*,\d{1,2}|\d+(?:[.,]\d{1,2})?/g, mm, achado = null;
          while ((mm = re.exec(semData)) !== null) achado = { v: mm[0], i: mm.index };
          if (!achado) return;
          var val = achado.v.replace(/\./g, '').replace(',', '.');
          var cent = Math.round(parseFloat(val) * 100);
          var nome = semData.slice(0, achado.i)
            .replace(/\b(vence|venc|vto|vcto|dia|dias|pagar|paga)\b/gi, ' ')
            .replace(/[-–:·]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (!nome || !cent) return;
          var venc = iso(addDias(hoje(), 30));
          if (dm) {
            var ano = dm[3] ? (dm[3].length === 2 ? 2000 + +dm[3] : +dm[3]) : hoje().getFullYear();
            var dd = new Date(ano, +dm[2] - 1, +dm[1]);
            // data sem ano que ja passou ha mais de 60 dias = ano que vem
            if (!dm[3] && (hoje() - dd) > 60 * 86400000) dd = new Date(ano + 1, +dm[2] - 1, +dm[1]);
            if (!isNaN(dd.getTime())) venc = iso(dd);
          }
          previa.push({ nome: nome, v: cent, venc: venc });
        });

        if (!previa.length) { toast('Não entendi nenhuma linha'); return; }

        var total = previa.reduce(function (a, x) { return a + x.v; }, 0);
        abrirSheet('<h3>Confira a lista</h3>' +
          '<p style="color:var(--ink-2);font-size:14px">' + previa.length + ' clientes · ' + brl(total) + ' no total</p>' +
          '<div class="card" style="max-height:240px;overflow:auto;padding:4px 14px">' +
          previa.map(function (x) {
            return '<div class="mov"><span class="txt"><b>' + esc(x.nome) + '</b><span>vence ' + dataCurta(x.venc) + '</span></span>' +
              '<span class="v f">' + brl(x.v) + '</span></div>';
          }).join('') + '</div>' +
          '<button class="btn primario" style="margin-top:14px" data-acao="importar-confirma">Importar ' + previa.length + '</button>');
        window.__previa = previa;
        break;
      }

      case 'importar-confirma': {
        var lista = window.__previa || [];
        lista.forEach(function (x) {
          var existente = S.clientes.filter(function (c) {
            return c.nome.toLowerCase() === x.nome.toLowerCase();
          })[0];
          if (!existente) {
            existente = { id: uid(), nome: x.nome, tel: '', criadoEm: Date.now() };
            S.clientes.push(existente);
          }
          S.movs.push({
            id: uid(), c: existente.id, t: 'f', v: x.v,
            data: iso(hoje()), venc: x.venc, obs: '', criadoEm: Date.now()
          });
        });
        salvar();
        fecharSheet();
        window.__previa = [];
        toast(lista.length + ' fiados importados');
        ir('clientes');
        render();
        break;
      }
    }
  });

  function centavos(el) {
    if (!el) return 0;
    var d = String(el.value || '').replace(/\D/g, '');
    return d ? parseInt(d, 10) : 0;
  }

  function editarCliente(id, aviso) {
    var c = dadosCliente(id);
    if (!c) return;
    abrirSheet('<h3>Editar cliente</h3>' +
      (aviso ? '<p style="color:var(--red);font-size:13.5px;margin:0 0 12px">' + esc(aviso) + '</p>' : '') +
      '<div class="campo"><label>Nome</label><input id="ec-nome" type="text" value="' + esc(c.nome) + '"></div>' +
      '<div class="campo"><label>WhatsApp</label><input id="ec-tel" type="tel" value="' + esc(c.tel || '') + '" placeholder="(47) 99999-9999"></div>' +
      '<button class="btn primario" data-acao="salvar-cliente" data-id="' + id + '">Salvar</button>' +
      (saldo(id) === 0 ? '<button class="btn perigo" style="margin-top:10px" data-acao="apagar-cliente" data-id="' + id + '">Apagar cliente</button>' : ''));
  }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-acao="salvar-cliente"],[data-acao="apagar-cliente"]');
    if (!el) return;
    var id = el.getAttribute('data-id');
    var c = dadosCliente(id);
    if (!c) return;
    if (el.getAttribute('data-acao') === 'salvar-cliente') {
      c.nome = (($('#ec-nome') || {}).value || c.nome).trim();
      c.tel = (($('#ec-tel') || {}).value || '').trim();
      salvar();
      fecharSheet();
      toast('Cliente salvo');
      render();
    } else {
      S.movs = S.movs.filter(function (m) { return m.c !== id; });
      S.clientes = S.clientes.filter(function (x) { return x.id !== id; });
      salvar();
      fecharSheet();
      toast('Cliente apagado');
      ir('clientes');
      render();
    }
  });

  /* ---------------- boot ---------------- */
  window.addEventListener('hashchange', render);
  if (S.onb && !location.hash) location.hash = '#/hoje';
  render();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { });
  }
})();
