create extension if not exists "pgcrypto";

create table if not exists recruitment_presentations (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  data date not null,
  horario text not null default '14:00',
  status text not null default 'agendada',
  observacao text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recruitment_presentations_status_check check (status in ('agendada', 'realizada', 'cancelada'))
);

create table if not exists recruitment_presentation_candidates (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references recruitment_presentations(id) on delete cascade,
  candidate_id uuid references recruitment_candidates(id) on delete set null,
  nome text not null,
  telefone text not null,
  telefone_normalizado text not null,
  email text,
  fonte text,
  status_participacao text not null default 'agendado',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recruitment_presentation_candidates_status_check check (
    status_participacao in ('agendado', 'confirmou_presenca', 'compareceu', 'nao_compareceu', 'sem_interesse')
  )
);

create unique index if not exists idx_recruitment_presentation_candidates_unique_phone
on recruitment_presentation_candidates(presentation_id, telefone_normalizado);

create index if not exists idx_recruitment_presentations_data
on recruitment_presentations(data);

create index if not exists idx_recruitment_presentations_status
on recruitment_presentations(status);

create index if not exists idx_recruitment_presentation_candidates_presentation
on recruitment_presentation_candidates(presentation_id);

create index if not exists idx_recruitment_presentation_candidates_phone
on recruitment_presentation_candidates(telefone_normalizado);

alter table recruitment_presentations enable row level security;
alter table recruitment_presentation_candidates enable row level security;

-- Policies temporarias para teste local/MVP.
-- Aplique apenas se o projeto ainda estiver usando anon key no MVP.
-- Antes de producao, troque por policies com authenticated/roles/organizacao.
--
-- create policy "TEMP MVP allow anon select recruitment presentations"
-- on recruitment_presentations
-- for select
-- to anon
-- using (true);
--
-- create policy "TEMP MVP allow anon insert recruitment presentations"
-- on recruitment_presentations
-- for insert
-- to anon
-- with check (true);
--
-- create policy "TEMP MVP allow anon update recruitment presentations"
-- on recruitment_presentations
-- for update
-- to anon
-- using (true)
-- with check (true);
--
-- create policy "TEMP MVP allow anon select recruitment presentation candidates"
-- on recruitment_presentation_candidates
-- for select
-- to anon
-- using (true);
--
-- create policy "TEMP MVP allow anon insert recruitment presentation candidates"
-- on recruitment_presentation_candidates
-- for insert
-- to anon
-- with check (true);
--
-- create policy "TEMP MVP allow anon update recruitment presentation candidates"
-- on recruitment_presentation_candidates
-- for update
-- to anon
-- using (true)
-- with check (true);
