-- TEMPORARIA PARA TESTE LOCAL/MVP
-- Esta policy permite INSERT publico apenas para validar a Fase 2.4.
-- Nao use em producao sem autenticacao, roles e escopo por usuario/organizacao.

grant usage on schema public to anon, authenticated;
grant insert on recruitment_candidates to anon, authenticated;

drop policy if exists "TEMP MVP allow anon insert recruitment candidates" on recruitment_candidates;
drop policy if exists "TEMP MVP allow public insert recruitment candidates" on recruitment_candidates;

create policy "TEMP MVP allow public insert recruitment candidates"
on recruitment_candidates
for insert
to public
with check (true);
