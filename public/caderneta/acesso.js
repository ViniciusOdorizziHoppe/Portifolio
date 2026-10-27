/* Caderneta — porteiro de acesso.
   O app só abre com assinatura ativa. Se a API ainda não existir (404),
   o app segue aberto, para não travar durante a publicação. */
(function (global) {
  'use strict';

  var CHAVE = 'caderneta.acesso';
  var liberado = false;
  var conta = null;
  var offline = false;
  var cbApp = null;
  var modo = 'entrar';
  var aviso = '';

  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { return null; } }
  function gravar(c) { try { localStorage.setItem(CHAVE, JSON.stringify(c)); } catch (e) { } }
  function limpar() { try { localStorage.removeItem(CHAVE); } catch (e) { } }

  function cacheBom() {
    var s = ler();
    if (!s || !s.acessoAte) return null;
    return new Date(s.acessoAte).getTime() > Date.now() ? s : null;
  }

  function app() { return document.getElementById('app'); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function dataBR(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.toLocaleDateString('pt-BR');
  }

  function liberar(dados) {
    liberado = true;
    conta = { email: dados.email, nome: dados.nome, acessoAte: dados.acessoAte };
    gravar({ email: dados.email, nome: dados.nome, acessoAte: dados.acessoAte, checadoEm: Date.now() });
  }

  async function pedir(url, corpo) {
    var r = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo || {})
    });
    var d = await r.json().catch(function () { return {}; });
    return { status: r.status, dados: d };
  }

  /* ---------------- telas ---------------- */

  function telaEntrar(msg) {
    var ativar = modo === 'ativar';
    return '' +
      '<div class="onb" style="padding-top:40px">' +
      '<img class="onb-selo" src="icone-192.png" alt="Caderneta" width="62" height="62">' +
      '<h1 style="font-size:27px">Entrar na Caderneta</h1>' +
      '<p class="lead" style="margin-bottom:18px">Use o <b>mesmo e-mail da compra</b> na Hotmart.</p>' +

      '<div class="pills" style="margin-bottom:18px">' +
      '<button class="pill" type="button" data-aba="entrar" aria-pressed="' + (!ativar) + '">Já tenho senha</button>' +
      '<button class="pill" type="button" data-aba="ativar" aria-pressed="' + ativar + '">Primeiro acesso</button>' +
      '</div>' +

      (msg ? '<div class="alerta" style="margin:0 0 16px"><span><b>Atenção</b><span>' + esc(msg) + '</span></span></div>' : '') +

      '<div class="campo"><label for="ac-email">E-mail da compra</label>' +
      '<input id="ac-email" type="text" inputmode="email" autocomplete="email" placeholder="voce@email.com" value="' + esc((ler() || {}).email || '') + '"></div>' +

      '<div class="campo"><label for="ac-senha">' + (ativar ? 'Crie uma senha' : 'Senha') + '</label>' +
      '<input id="ac-senha" type="password" autocomplete="' + (ativar ? 'new-password' : 'current-password') + '" placeholder="' + (ativar ? 'mínimo 6 caracteres' : 'sua senha') + '"></div>' +

      (ativar ? '<div class="campo" id="ac-rep-wrap"><label for="ac-rep">Repita a senha</label>' +
        '<input id="ac-rep" type="password" autocomplete="new-password" placeholder="repita a senha"></div>' : '') +

      '<button class="btn primario" data-acao="ac-enviar">' + (ativar ? 'Ativar minha conta' : 'Entrar') + '</button>' +
      '<p class="rodape-nota">Ainda não tem acesso? <a href="https://pay.hotmart.com" target="_blank" rel="noopener" style="color:var(--ink);text-decoration:underline">Ver a Caderneta na Hotmart</a></p>' +
      '</div>';
  }

  function telaBloqueio(d) {
    var motivo = d && d.motivo;
    var txt = motivo === 'reembolsado'
      ? 'Essa compra foi reembolsada, então o acesso foi encerrado.'
      : motivo === 'cancelado'
        ? 'Sua assinatura foi cancelada.'
        : 'Sua assinatura venceu.';
    return '<div class="onb" style="padding-top:60px">' +
      '<div class="onb-selo" style="display:grid;place-items:center;background:var(--yellow);border-radius:16px;font-size:28px">🔒</div>' +
      '<h1 style="font-size:26px">Acesso encerrado</h1>' +
      '<p class="lead">' + esc(txt) + ' Seus dados continuam neste aparelho e voltam quando você renovar.</p>' +
      '<button class="btn primario" data-acao="ac-sair">Entrar com outra conta</button>' +
      '<a class="btn ghost" href="https://pay.hotmart.com" target="_blank" rel="noopener" style="margin-top:10px">Renovar assinatura</a>' +
      '<p class="rodape-nota">' + esc((d && d.email) || '') + (d && d.acessoAte ? ' · acesso até ' + dataBR(d.acessoAte) : '') + '</p>' +
      '</div>';
  }

  function desenhar(msg) {
    var alvo = app();
    if (!alvo) return;
    if (modo === 'bloqueio') { alvo.innerHTML = telaBloqueio(window.__bloqueio || {}); }
    else { alvo.innerHTML = telaEntrar(msg); }
    var em = document.getElementById('ac-email');
    if (em && !em.value) setTimeout(function () { em.focus(); }, 50);
  }

  async function enviar() {
    var email = ((document.getElementById('ac-email') || {}).value || '').trim();
    var senha = ((document.getElementById('ac-senha') || {}).value || '');
    var rep = document.getElementById('ac-rep');
    var b = document.querySelector('[data-acao="ac-enviar"]');
    if (b) { b.disabled = true; b.textContent = 'Aguarde...'; }

    var falha = function (m) {
      if (b) { b.disabled = false; b.textContent = modo === 'ativar' ? 'Ativar minha conta' : 'Entrar'; }
      desenhar(m);
    };

    if (!email || email.indexOf('@') < 1) return falha('Digite o e-mail que você usou na compra.');
    if (!senha) return falha('Digite a senha.');
    if (modo === 'ativar') {
      if (senha.length < 6) return falha('A senha precisa ter pelo menos 6 caracteres.');
      if (rep && rep.value !== senha) return falha('As duas senhas não são iguais.');
    }

    try {
      var r = await pedir(modo === 'ativar' ? '/api/ativar' : '/api/entrar', { email: email, senha: senha });
      if (r.status === 200 && r.dados.ok) {
        liberar(r.dados);
        if (cbApp) cbApp(conta);
        return;
      }
      if (r.dados.erro === 'ja_ativada') { modo = 'entrar'; return falha('Essa conta já tem senha. Use "Já tenho senha".'); }
      return falha(r.dados.mensagem || 'Não consegui entrar. Confira os dados.');
    } catch (e) {
      return falha('Sem conexão com o servidor. Tente de novo.');
    }
  }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-acao],[data-aba]');
    if (!el) return;
    if (el.hasAttribute('data-aba')) {
      modo = el.getAttribute('data-aba');
      desenhar();
      return;
    }
    var acao = el.getAttribute('data-acao');
    if (acao === 'ac-enviar') { ev.preventDefault(); enviar(); }
    if (acao === 'ac-sair') { global.Acesso.sair(); }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    if (!document.getElementById('ac-senha')) return;
    ev.preventDefault();
    enviar();
  });

  /* ---------------- porta de entrada ---------------- */

  async function iniciar(cb) {
    cbApp = cb;
    var cache = cacheBom();

    try {
      var r = await fetch('/api/sessao', { credentials: 'same-origin', cache: 'no-store' });
      var d = await r.json().catch(function () { return {}; });

      if (r.status === 200 && d.liberado) { liberar(d); return cb(conta); }

      // API ainda não publicada: não trava o app durante a transição
      if (r.status === 404) { liberado = true; conta = { aberto: true }; return cb(conta); }

      if (r.status === 401) {
        if (cache) { liberado = true; conta = cache; offline = true; return cb(conta); }
        modo = 'entrar';
        return desenhar();
      }

      if (r.status === 403) {
        modo = 'bloqueio';
        window.__bloqueio = d;
        return desenhar();
      }

      // 500 e afins: se o aparelho já foi liberado antes, não derruba o lojista
      if (cache) { liberado = true; conta = cache; offline = true; return cb(conta); }
      modo = 'entrar';
      return desenhar('Estamos com instabilidade no servidor. Tente de novo em alguns minutos.');
    } catch (e) {
      if (cache) { liberado = true; conta = cache; offline = true; return cb(conta); }
      modo = 'entrar';
      return desenhar('Você está sem internet. Conecte-se uma vez para entrar na sua caderneta.');
    }
  }

  async function sair() {
    try { await fetch('/api/sair', { method: 'POST', credentials: 'same-origin' }); } catch (e) { }
    limpar();
    liberado = false;
    conta = null;
    location.reload();
  }

  global.Acesso = {
    iniciar: iniciar,
    sair: sair,
    estado: function () { return { liberado: liberado, conta: conta, offline: offline }; }
  };
})(window);
