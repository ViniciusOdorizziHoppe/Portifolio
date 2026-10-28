-- Configuração do painel de vendas (/hotmartdashboard).
-- Segredos ficam no servidor: a função lê daqui e nunca expõe ao navegador.
create table if not exists dashboard_config (
  chave text primary key,
  valor text not null,
  atualizado_em timestamptz not null default now()
);

comment on table dashboard_config is
  'Chaves do painel Hotmart. Variáveis de ambiente da Vercel têm prioridade sobre estes valores.';
