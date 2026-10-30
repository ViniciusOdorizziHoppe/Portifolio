// Regras de negócio do Enemzeiro. Recebe a função de consulta (q) para poder ser
// testada fora do Postgres de produção (PGlite) — mesmo padrão de _dominio.js.

export const STATUS_LIBERA = 'ativo';

/** Normaliza e-mail (trim + minúsculo). Retorna '' se inválido. */
export function emailLimpo(v) {
  const e = String(v || '').trim().toLowerCase();
  if (e.length < 5 || e.length > 254) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return '';
  return e;
}

export function nomeLimpo(v) {
  const n = String(v || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  return n;
}

export function telefoneLimpo(v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 15);
  return d || null;
}

/* ------------------------------------------------------------------ contas */

export async function contaPorEmail(q, email) {
  const r = await q(
    `select c.id, c.email, c.nome, c.senha_hash,
            a.status, a.plano, a.acesso_ate, a.origem
       from ez_contas c left join ez_acessos a on a.conta_id = c.id
      where c.email = $1`,
    [email]
  );
  return r.rows[0] || null;
}

/**
 * Cria a conta. Se já existir conta sem senha (criada por webhook de compra),
 * apenas completa o cadastro — desde que o e-mail bata com a compra.
 * Retorna { erro } ou { conta }.
 */
export async function criarConta(q, { email, nome, telefone, senhaHash, trialDias = 0 }) {
  if (!email) return { erro: 'email' };
  const existente = await q('select id, senha_hash from ez_contas where email = $1', [email]);

  if (existente.rows.length) {
    const c = existente.rows[0];
    if (c.senha_hash) return { erro: 'ja_existe' };
    // conta veio de uma compra: define a senha e mantém o acesso que já existe
    await q(
      `update ez_contas set senha_hash = $2, nome = coalesce(nullif($3,''), nome),
              telefone = coalesce($4, telefone), atualizado_em = now()
        where id = $1`,
      [c.id, senhaHash, nome || '', telefone || null]
    );
    const conta = await contaPorEmail(q, email);
    return { conta };
  }

  const r = await q(
    `insert into ez_contas (email, nome, telefone, senha_hash)
     values ($1, $2, $3, $4) returning id`,
    [email, nome || null, telefone || null, senhaHash]
  );
  const id = r.rows[0].id;

  const dias = Math.max(0, Math.min(30, Number(trialDias) || 0));
  await q(
    `insert into ez_acessos (conta_id, status, plano, acesso_ate, origem)
     values ($1, $2, $3, now() + ($4 || ' days')::interval, 'trial')`,
    [id, dias > 0 ? STATUS_LIBERA : 'inativo', dias > 0 ? 'teste' : null, String(dias)]
  );

  const conta = await contaPorEmail(q, email);
  return { conta };
}

/** Login por Google: entra se existir, cria se for a primeira vez. */
export async function entrarOuCriarOauth(q, { email, nome, trialDias = 0 }) {
  const r = await criarConta(q, { email, nome, telefone: null, senhaHash: null, trialDias });
  if (r.erro === 'ja_existe') {
    const conta = await contaPorEmail(q, email);
    if (!conta) return { erro: 'nao_encontrada' };
    return { conta };
  }
  return r;
}

/** Primeiro acesso de quem comprou: define a senha. */
export async function definirSenha(q, { email, senhaHash }) {
  const conta = await contaPorEmail(q, email);
  if (!conta) return { erro: 'nao_encontrada' };
  if (conta.senha_hash) return { erro: 'ja_ativada' };
  await q('update ez_contas set senha_hash = $2, atualizado_em = now() where id = $1',
    [conta.id, senhaHash]);
  return { conta: { ...conta, senha_hash: senhaHash } };
}

/* ---------------------------------------------------------------- acessos */

export function acessoLiberado(conta) {
  if (!conta) return false;
  // reembolso corta na hora; cancelamento deixa usar até o fim do período pago
  if (conta.status === 'reembolsado') return false;
  if (!conta.acesso_ate) return false;
  return new Date(conta.acesso_ate).getTime() > Date.now();
}

function mesesDoPlano({ plano, valor }) {
  const nome = String(plano || '').toLowerCase();
  if (nome.includes('anual') || nome.includes('annual') || nome.includes('year')) return 12;
  if (nome.includes('mensal') || nome.includes('monthly') || nome.includes('month')) return 1;
  return Number(valor) >= 200 ? 12 : 1;
}

/** Libera ou renova o acesso. Cria a conta se ainda não existir. */
export async function liberarAcesso(q, { email, nome, plano, valor, meses, origem, ref }) {
  if (!email) throw new Error('email obrigatorio');
  const m = String(meses || mesesDoPlano({ plano, valor }));

  await q(
    `insert into ez_contas (email, nome) values ($1, $2)
     on conflict (email) do update set nome = coalesce(nullif(excluded.nome,''), ez_contas.nome),
       atualizado_em = now()`,
    [email, nome || null]
  );
  const c = await q('select id from ez_contas where email = $1', [email]);
  const contaId = c.rows[0].id;

  await q(
    `insert into ez_acessos (conta_id, status, plano, acesso_ate, origem, ref_externa, atualizado_em)
     values ($1, $2, $3, now() + ($4 || ' months')::interval, $5, $6, now())
     on conflict (conta_id) do update set
       status = $2,
       plano = coalesce(excluded.plano, ez_acessos.plano),
       acesso_ate = greatest(coalesce(ez_acessos.acesso_ate, now()), now()) + ($4 || ' months')::interval,
       origem = coalesce(excluded.origem, ez_acessos.origem),
       ref_externa = coalesce(excluded.ref_externa, ez_acessos.ref_externa),
       atualizado_em = now()`,
    [contaId, STATUS_LIBERA, plano || null, m, origem || null, ref || null]
  );

  const r = await q(
    `select c.id, c.email, c.nome, a.status, a.plano, a.acesso_ate
       from ez_contas c join ez_acessos a on a.conta_id = c.id
      where c.id = $1`, [contaId]
  );
  return r.rows[0];
}

/** Cancela ou reembolsa. Reembolso corta na hora; cancelamento preserva o período pago. */
export async function revogarAcesso(q, { email, status }) {
  if (!email) return null;
  const novo = status === 'reembolsado' ? 'reembolsado' : 'cancelado';
  const r = await q(
    `update ez_acessos a set status = $2,
       acesso_ate = case when $2 = 'reembolsado' then now() else a.acesso_ate end,
       atualizado_em = now()
      from ez_contas c
     where c.id = a.conta_id and c.email = $1
     returning c.email, a.status, a.acesso_ate`,
    [email, novo]
  );
  return r.rows[0] || null;
}

/* ---------------------------------------------------------------- eventos */

/** Registra o evento uma única vez. false = já tinha sido processado. */
export async function registrarEvento(q, { id, plataforma, tipo, email, payload }) {
  const r = await q(
    `insert into ez_eventos (id, plataforma, tipo, email, payload)
     values ($1, $2, $3, $4, $5) on conflict (id) do nothing returning id`,
    [id, plataforma || null, tipo || null, email || null, JSON.stringify(payload || {})]
  );
  return r.rowCount > 0;
}

/* ---------------------------------------------------------------- sessões */

export async function abrirSessao(q, contaId, dias = 30) {
  const token = (await import('node:crypto')).randomBytes(32).toString('hex');
  const expira = new Date(Date.now() + dias * 86400000);
  await q('insert into ez_sessoes (token, conta_id, expira_em) values ($1, $2, $3)',
    [token, contaId, expira]);
  return { token, expira };
}

export async function contaDaSessao(q, token) {
  if (!token) return null;
  const r = await q(
    `select c.id, c.email, c.nome,
            a.status, a.plano, a.acesso_ate, a.origem
       from ez_sessoes s join ez_contas c on c.id = s.conta_id
       left join ez_acessos a on a.conta_id = c.id
      where s.token = $1 and s.expira_em > now()`,
    [token]
  );
  return r.rows[0] || null;
}

export async function fecharSessao(q, token) {
  if (!token) return;
  await q('delete from ez_sessoes where token = $1', [token]);
}

/* -------------------------------------------------------------- progresso */

export async function lerProgresso(q, contaId) {
  const r = await q('select dados from ez_progresso where conta_id = $1', [contaId]);
  return r.rows[0] ? r.rows[0].dados : null;
}

export async function salvarProgresso(q, contaId, dados) {
  await q(
    `insert into ez_progresso (conta_id, dados, atualizado_em) values ($1, $2, now())
     on conflict (conta_id) do update set dados = $2, atualizado_em = now()`,
    [contaId, JSON.stringify(dados)]
  );
}

/* ------------------------------------------------------- força bruta login */

export async function tentativasRestantes(q, chave) {
  const r = await q('select tentativas, bloqueado_ate from ez_tentativas where chave = $1', [chave]);
  const row = r.rows[0];
  if (!row) return { bloqueado: false, restantes: 10 };
  if (row.bloqueado_ate && new Date(row.bloqueado_ate).getTime() > Date.now()) {
    return { bloqueado: true, restantes: 0 };
  }
  return { bloqueado: false, restantes: Math.max(0, 10 - row.tentativas) };
}

export async function registrarFalha(q, chave) {
  const r = await q(
    `insert into ez_tentativas (chave, tentativas) values ($1, 1)
     on conflict (chave) do update set tentativas = ez_tentativas.tentativas + 1
     returning tentativas`,
    [chave]
  );
  const n = r.rows[0].tentativas;
  if (n >= 10) {
    await q('update ez_tentativas set bloqueado_ate = now() + interval \'15 minutes\', tentativas = 0 where chave = $1', [chave]);
  }
  return n;
}

export async function limparFalhas(q, chave) {
  await q('delete from ez_tentativas where chave = $1', [chave]);
}
