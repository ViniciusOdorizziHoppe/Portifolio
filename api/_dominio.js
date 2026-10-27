// Regras de negócio do acesso. Recebe a função de consulta (q) para poder
// ser testada fora do Postgres de produção (ver tests/caderneta-acesso.test.mjs).

export const APROVADO = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'];
export const ESTORNO = ['PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK'];
export const CANCELADO = ['PURCHASE_CANCELED', 'SUBSCRIPTION_CANCELLATION'];

function mesesDoPlano(ev) {
  const nome = String(ev.planoNome || '').toLowerCase();
  if (nome.includes('mensal') || nome.includes('monthly')) return 1;
  if (nome.includes('anual') || nome.includes('annual')) return 12;
  return Number(ev.valor) >= 300 ? 12 : 1;
}

/** Registra o evento uma única vez. Retorna false se já tinha sido processado. */
export async function registrarEvento(q, { id, tipo, email, payload }) {
  const r = await q(
    `insert into eventos (id, tipo, email, payload) values ($1, $2, $3, $4)
     on conflict (id) do nothing returning id`,
    [id, tipo, email || null, JSON.stringify(payload || {})]
  );
  return r.rowCount > 0;
}

/** Libera (ou renova) o acesso de um e-mail. */
export async function liberarAcesso(q, { email, nome, plano, meses, codigo }) {
  if (!email) throw new Error('email obrigatorio');
  const alvo = email.toLowerCase();
  await q(
    `insert into contas (email, nome, status, plano, acesso_ate, hotmart_codigo, origem)
     values ($1, $2, 'ativo', $3, now() + ($4 || ' months')::interval, $5, 'hotmart')
     on conflict (email) do update set
       nome = coalesce(excluded.nome, contas.nome),
       status = 'ativo',
       plano = excluded.plano,
       hotmart_codigo = coalesce(excluded.hotmart_codigo, contas.hotmart_codigo),
       acesso_ate = greatest(coalesce(contas.acesso_ate, now()), now()) + ($4 || ' months')::interval,
       atualizado_em = now()
     returning id, email, acesso_ate`,
    [alvo, nome || null, plano || null, String(meses), codigo || null]
  );
  const r = await q('select id, email, nome, status, plano, acesso_ate from contas where email = $1', [alvo]);
  return r.rows[0];
}

export async function revogarAcesso(q, { email, status }) {
  const alvo = String(email || '').toLowerCase();
  if (!alvo) return null;
  const novo = status === 'reembolsado' ? 'reembolsado' : 'cancelado';
  const r = await q(
    `update contas set status = $2,
       acesso_ate = case when $2 = 'reembolsado' then now() else acesso_ate end,
       atualizado_em = now()
     where email = $1
     returning id, email, status, acesso_ate`,
    [alvo, novo]
  );
  return r.rows[0] || null;
}

/** Traduz o payload da Hotmart em uma ação do sistema. */
export async function aplicarEvento(q, ev) {
  const tipo = String(ev.evento || '').toUpperCase();
  const email = String(ev.email || '').toLowerCase();
  const idEvento = `${tipo}:${ev.transacao || email || 'sem-transacao'}`;

  // sem e-mail não há como identificar o comprador: não cria conta vazia
  if (!email) return { acao: 'ignorado', motivo: 'sem email' };

  const novo = await registrarEvento(q, { id: idEvento, tipo, email, payload: ev.original });
  if (!novo) return { acao: 'repetido', id: idEvento };

  if (APROVADO.includes(tipo)) {
    const conta = await liberarAcesso(q, {
      email,
      nome: ev.nome,
      plano: mesesDoPlano(ev) === 12 ? 'anual' : 'mensal',
      meses: mesesDoPlano(ev),
      codigo: ev.transacao
    });
    return { acao: 'liberado', email, acessoAte: conta && conta.acesso_ate };
  }

  if (ESTORNO.includes(tipo)) {
    const conta = await revogarAcesso(q, { email, status: 'reembolsado' });
    return { acao: 'reembolsado', email, conta };
  }

  if (CANCELADO.includes(tipo)) {
    const conta = await revogarAcesso(q, { email, status: 'cancelado' });
    return { acao: 'cancelado', email, conta };
  }

  return { acao: 'ignorado', tipo };
}

/** Cria a senha da conta no primeiro acesso. */
export async function ativarConta(q, { email, senhaHash }) {
  const alvo = String(email || '').toLowerCase();
  const r = await q('select * from contas where email = $1', [alvo]);
  const conta = r.rows[0];
  if (!conta) return { erro: 'nao_encontrada' };
  if (conta.senha_hash) return { erro: 'ja_ativada' };
  if (conta.status !== 'ativo') return { erro: 'inativa' };
  if (conta.acesso_ate && new Date(conta.acesso_ate).getTime() < Date.now()) return { erro: 'expirada' };
  await q('update contas set senha_hash = $2, atualizado_em = now() where id = $1', [conta.id, senhaHash]);
  return { conta: { ...conta, senha_hash: senhaHash } };
}

export async function contaPorEmail(q, email) {
  const r = await q('select * from contas where email = $1', [String(email || '').toLowerCase()]);
  return r.rows[0] || null;
}
