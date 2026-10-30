-- Enemzeiro: contas, sessões, acesso (entitlement) e progresso.
-- Separado das tabelas da Caderneta de propósito: público e ciclo de vida diferentes.

-- identidade
create table if not exists ez_contas (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  nome          text,
  telefone      text,
  senha_hash    text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- sessão (token opaco, guardado só no servidor)
create table if not exists ez_sessoes (
  token      text primary key,
  conta_id   uuid not null references ez_contas(id) on delete cascade,
  expira_em  timestamptz not null,
  criado_em  timestamptz not null default now()
);
create index if not exists ez_sessoes_conta on ez_sessoes(conta_id);

-- direito de uso (o que a compra libera)
create table if not exists ez_acessos (
  conta_id      uuid primary key references ez_contas(id) on delete cascade,
  status        text not null default 'inativo',   -- ativo | cancelado | reembolsado | inativo
  plano         text,
  acesso_ate    timestamptz,
  origem        text,                              -- hotmart | kiwify | eduzz | monetizze | kirvano | trial
  ref_externa   text,
  atualizado_em timestamptz not null default now()
);

-- idempotência dos webhooks
create table if not exists ez_eventos (
  id          text primary key,
  plataforma  text,
  tipo        text,
  email       text,
  payload     jsonb,
  recebido_em timestamptz not null default now()
);
create index if not exists ez_eventos_email on ez_eventos(email);

-- progresso sincronizado (um blob por conta)
create table if not exists ez_progresso (
  conta_id      uuid primary key references ez_contas(id) on delete cascade,
  dados         jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

-- freio de força bruta no login
create table if not exists ez_tentativas (
  chave         text primary key,
  tentativas    int not null default 0,
  bloqueado_ate timestamptz
);
