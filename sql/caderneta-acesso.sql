-- Caderneta · esquema do controle de acesso
-- Rode uma vez no banco (Neon/Supabase/Postgres) antes de publicar a API.

create table if not exists contas (
  id           bigserial primary key,
  email        text not null unique,
  nome         text,
  senha_hash   text,
  status       text not null default 'ativo',   -- ativo | cancelado | reembolsado
  plano        text,                            -- anual | mensal
  acesso_ate   timestamptz,
  hotmart_codigo text,
  origem       text default 'hotmart',
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists contas_email_idx on contas (lower(email));

create table if not exists sessoes (
  token     text primary key,
  conta_id  bigint not null references contas(id) on delete cascade,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null
);

create index if not exists sessoes_conta_idx on sessoes (conta_id);

create table if not exists eventos (
  id          text primary key,       -- evento:transacao (idempotencia)
  tipo        text not null,
  email       text,
  payload     jsonb,
  recebido_em timestamptz not null default now()
);
