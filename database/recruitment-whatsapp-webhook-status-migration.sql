-- Fase 16 - WhatsApp webhook status support
-- Apply this before enabling the Meta webhook if recruitment_contact_history
-- still has the old status check constraint.

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
    'alteracao_funil',
    'whatsapp_status'
  )
);
