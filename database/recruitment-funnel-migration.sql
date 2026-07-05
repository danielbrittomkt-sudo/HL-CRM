-- Fase 6.1 - Persistencia do funil de recrutamento
-- Execute este SQL no Supabase antes de publicar a Fase 6 em producao.

alter table recruitment_candidates
add column if not exists funil_status text;

update recruitment_candidates
set funil_status = raw->>'funilStatus'
where funil_status is null
  and raw ? 'funilStatus';

alter table recruitment_candidates
drop constraint if exists recruitment_candidates_funil_status_check;

alter table recruitment_candidates
add constraint recruitment_candidates_funil_status_check
check (
  funil_status is null
  or funil_status in (
    'Novo candidato',
    'Na fila de envio',
    'WhatsApp enviado',
    'Respondeu',
    'Confirmou interesse',
    'Apresentação agendada',
    'Compareceu',
    'Não compareceu',
    'Sem interesse',
    'Telefone inválido'
  )
);

create index if not exists idx_recruitment_candidates_funil_status
on recruitment_candidates(funil_status);

grant update on recruitment_candidates to anon, authenticated;

drop policy if exists "TEMP MVP allow public update recruitment candidates" on recruitment_candidates;

create policy "TEMP MVP allow public update recruitment candidates"
on recruitment_candidates
for update
to public
using (true)
with check (true);

alter table recruitment_contact_history
drop constraint if exists recruitment_contact_history_status_check;

alter table recruitment_contact_history
add constraint recruitment_contact_history_status_check
check (
  status in (
    'mensagem_enviada',
    'erro_envio',
    'confirmado',
    'nao_respondeu',
    'alteracao_funil'
  )
);
