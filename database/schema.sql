create extension if not exists "pgcrypto";

create type user_role as enum ('ADMIN', 'GESTOR', 'CORRETOR', 'CLIENTE');
create type operational_status as enum ('Ativo', 'Atenção', 'Pausado');
create type folder_status as enum ('Novo', 'Em análise', 'Visita', 'Proposta', 'Banco', 'Vendido', 'Perdido');
create type lead_level as enum ('Lead quente', 'Lead morno', 'Lead frio');

create table corretores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  foto text,
  email text not null unique,
  telefone text,
  equipe text not null,
  supervisor text,
  data_entrada date not null,
  tempo_empresa integer not null default 0,
  status_operacional operational_status not null default 'Ativo',
  pastas_subidas integer not null default 0,
  leads_recebidos integer not null default 0,
  leads_respondidos integer not null default 0,
  tempo_medio_resposta numeric(8,2) not null default 0,
  followups integer not null default 0,
  visitas_agendadas integer not null default 0,
  visitas_realizadas integer not null default 0,
  propostas_enviadas integer not null default 0,
  ligacoes_realizadas integer not null default 0,
  plantoes integer not null default 0,
  frequencia_operacional numeric(5,2) not null default 0,
  origem_leads text[] not null default '{}',
  vendas_historicas integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome_cliente text not null,
  cpf_encrypted bytea not null,
  cpf_hash text not null unique,
  idade integer not null check (idade >= 18),
  estado_civil text not null,
  renda_mensal numeric(14,2) not null default 0,
  mora_de_aluguel boolean not null default false,
  mora_com_pais boolean not null default false,
  fgts_disponivel numeric(14,2) not null default 0,
  valor_entrada numeric(14,2) not null default 0,
  dependentes integer not null default 0,
  profissao text,
  score_credito integer not null check (score_credito between 0 and 1000),
  cidade text not null,
  tipo_imovel_interesse text not null,
  valor_imovel_interesse numeric(14,2) not null,
  origem text,
  consentimento_lgpd boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table perfil_financeiro (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  renda_composta numeric(14,2),
  comprometimento_renda numeric(6,2),
  capacidade_financiamento numeric(14,2),
  risco_credito numeric(6,2),
  observacoes text,
  created_at timestamptz not null default now()
);

create table pastas (
  id uuid primary key default gen_random_uuid(),
  corretor_id uuid not null references corretores(id),
  cliente_id uuid not null references clientes(id),
  empreendimento text not null,
  tipo_imovel text not null,
  valor_imovel numeric(14,2) not null,
  renda_aprovada numeric(14,2),
  status folder_status not null default 'Novo',
  data_envio date not null default current_date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vendas (
  id uuid primary key default gen_random_uuid(),
  pasta_id uuid not null references pastas(id),
  corretor_id uuid not null references corretores(id),
  cliente_id uuid not null references clientes(id),
  valor_venda numeric(14,2) not null,
  comissao numeric(14,2),
  data_venda date not null default current_date,
  aprovado_banco boolean not null default false,
  created_at timestamptz not null default now()
);

create table analises_clientes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  ipc_cliente integer not null check (ipc_cliente between 0 and 100),
  chance_compra integer not null check (chance_compra between 0 and 100),
  chance_aprovacao_bancaria integer not null check (chance_aprovacao_bancaria between 0 and 100),
  potencial_conversao integer not null check (potencial_conversao between 0 and 100),
  risco_reprovacao integer not null check (risco_reprovacao between 0 and 100),
  perfil_comprador text,
  nivel_lead lead_level not null,
  modelo_versao text not null default 'rules-v1',
  created_at timestamptz not null default now()
);

create table analises_corretores (
  id uuid primary key default gen_random_uuid(),
  corretor_id uuid not null references corretores(id) on delete cascade,
  ipc_corretor integer not null check (ipc_corretor between 0 and 100),
  probabilidade_venda_30 integer not null check (probabilidade_venda_30 between 0 and 100),
  probabilidade_venda_90 integer not null check (probabilidade_venda_90 between 0 and 100),
  risco_baixa_performance integer not null check (risco_baixa_performance between 0 and 100),
  potencial_comercial text not null,
  comparacao_historica text,
  modelo_versao text not null default 'rules-v1',
  created_at timestamptz not null default now()
);

create table historico_conversao (
  id uuid primary key default gen_random_uuid(),
  periodo date not null,
  origem_lead text,
  faixa_renda text,
  estado_civil text,
  mora_de_aluguel boolean,
  total_leads integer not null default 0,
  visitas integer not null default 0,
  propostas integer not null default 0,
  vendas integer not null default 0,
  taxa_conversao numeric(6,2) generated always as (
    case when total_leads = 0 then 0 else (vendas::numeric / total_leads::numeric) * 100 end
  ) stored
);

create table relatorios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null,
  resumo text not null,
  metricas jsonb not null default '{}',
  filtros jsonb not null default '{}',
  criado_por uuid,
  created_at timestamptz not null default now()
);

create table usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  nome text not null,
  email text not null unique,
  role user_role not null default 'GESTOR',
  corretor_id uuid references corretores(id),
  cliente_id uuid references clientes(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_corretores_equipe on corretores(equipe);
create index idx_corretores_ipc_inputs on corretores(frequencia_operacional, tempo_medio_resposta, propostas_enviadas);
create index idx_clientes_hash on clientes(cpf_hash);
create index idx_clientes_financeiro on clientes(renda_mensal, score_credito, valor_entrada, fgts_disponivel);
create index idx_pastas_status on pastas(status);
create index idx_pastas_corretor_cliente on pastas(corretor_id, cliente_id);
create index idx_vendas_data on vendas(data_venda);
create index idx_historico_periodo on historico_conversao(periodo, origem_lead);
create index idx_analises_clientes_score on analises_clientes(ipc_cliente, chance_compra);
create index idx_analises_corretores_score on analises_corretores(ipc_corretor, probabilidade_venda_30);

create view corretores_com_tempo_empresa as
select
  corretores.*,
  ((date_part('year', age(current_date, data_entrada)) * 12 + date_part('month', age(current_date, data_entrada)))::integer) as tempo_empresa_calculado
from corretores;

alter table clientes enable row level security;
alter table corretores enable row level security;
alter table pastas enable row level security;
alter table vendas enable row level security;

create policy "admin_all_clientes" on clientes for all using (
  exists (select 1 from usuarios where auth_user_id = auth.uid() and role = 'ADMIN')
);

create policy "gestor_read_clientes" on clientes for select using (
  exists (select 1 from usuarios where auth_user_id = auth.uid() and role in ('ADMIN', 'GESTOR'))
);

create policy "cliente_self_read" on clientes for select using (
  exists (select 1 from usuarios where auth_user_id = auth.uid() and usuarios.cliente_id = clientes.id)
);

create policy "corretor_own_pastas" on pastas for select using (
  exists (select 1 from usuarios where auth_user_id = auth.uid() and (role in ('ADMIN', 'GESTOR') or usuarios.corretor_id = pastas.corretor_id))
);
