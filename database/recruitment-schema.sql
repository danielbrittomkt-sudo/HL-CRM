create extension if not exists "pgcrypto";

create table if not exists recruitment_candidates (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  telefone_normalizado text not null,
  email text,
  email_normalizado text,
  cidade text,
  cargo text,
  fonte text,
  status text not null default 'Valido',
  import_batch_id uuid,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recruitment_candidates_status_check check (status in ('Valido', 'Revisar', 'Duplicado', 'Invalido'))
);

create table if not exists recruitment_queue (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references recruitment_candidates(id) on delete set null,
  nome text not null,
  telefone text not null,
  telefone_normalizado text not null,
  fonte text,
  cargo text,
  data_apresentacao date not null,
  horario_apresentacao text not null,
  apresentacao text not null,
  mensagem text not null,
  status_envio text not null default 'pendente_envio',
  import_batch_id uuid,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recruitment_queue_status_envio_check check (status_envio in ('pendente_envio', 'mensagem_enviada'))
);

create table if not exists recruitment_contact_history (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references recruitment_candidates(id) on delete set null,
  nome text not null,
  telefone text not null,
  telefone_normalizado text not null,
  fonte text,
  data_envio timestamptz not null default now(),
  data_apresentacao text not null,
  status text not null,
  mensagem text not null,
  data text,
  import_batch_id uuid,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recruitment_contact_history_status_check check (status in ('mensagem_enviada', 'erro_envio', 'confirmado', 'nao_respondeu'))
);

create table if not exists recruitment_settings (
  id text primary key default 'default',
  quantidade_por_dia integer not null default 50,
  horario_envio text not null default '07:00',
  dias_apresentacao text[] not null default array['Terca', 'Quinta'],
  horario_apresentacao text not null default '14:00',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recruitment_settings_quantidade_por_dia_check check (quantidade_por_dia > 0 and quantidade_por_dia <= 500)
);

create unique index if not exists idx_recruitment_candidates_telefone_normalizado on recruitment_candidates(telefone_normalizado);
create index if not exists idx_recruitment_candidates_email_normalizado on recruitment_candidates(email_normalizado);
create index if not exists idx_recruitment_candidates_status on recruitment_candidates(status);
create index if not exists idx_recruitment_candidates_import_batch on recruitment_candidates(import_batch_id);
create index if not exists idx_recruitment_queue_status_envio on recruitment_queue(status_envio);
create index if not exists idx_recruitment_queue_data_apresentacao on recruitment_queue(data_apresentacao);
create index if not exists idx_recruitment_queue_telefone_normalizado on recruitment_queue(telefone_normalizado);
create index if not exists idx_recruitment_contact_history_telefone_normalizado on recruitment_contact_history(telefone_normalizado);
create index if not exists idx_recruitment_contact_history_status on recruitment_contact_history(status);
create index if not exists idx_recruitment_contact_history_data_envio on recruitment_contact_history(data_envio);

alter table recruitment_candidates enable row level security;
alter table recruitment_queue enable row level security;
alter table recruitment_contact_history enable row level security;
alter table recruitment_settings enable row level security;

-- Policies preparadas para Fase 2.x.
-- Ajuste os predicados quando existir autenticacao/organizacao definida.
--
-- create policy "recruitment_candidates_authenticated_read"
-- on recruitment_candidates for select
-- to authenticated
-- using (true);
--
-- create policy "recruitment_candidates_authenticated_write"
-- on recruitment_candidates for all
-- to authenticated
-- using (true)
-- with check (true);
--
-- create policy "recruitment_queue_authenticated_all"
-- on recruitment_queue for all
-- to authenticated
-- using (true)
-- with check (true);
--
-- create policy "recruitment_contact_history_authenticated_all"
-- on recruitment_contact_history for all
-- to authenticated
-- using (true)
-- with check (true);
--
-- create policy "recruitment_settings_authenticated_all"
-- on recruitment_settings for all
-- to authenticated
-- using (true)
-- with check (true);
