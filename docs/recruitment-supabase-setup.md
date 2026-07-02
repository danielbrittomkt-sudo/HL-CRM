# Setup Supabase - Modulo Recrutamento

Este guia prepara o banco do modulo Recrutamento para uma fase futura. A interface atual ainda usa `localStorage`; nao conecte a UI ao Supabase nesta etapa.

## Tabelas criadas

O arquivo `database/recruitment-schema.sql` cria:

- `recruitment_candidates`: candidatos importados, com telefone/email normalizados, status, lote de importacao e payload bruto em `raw`.
- `recruitment_queue`: fila de envio, com dados da apresentacao, mensagem pronta e `status_envio`.
- `recruitment_contact_history`: historico de contatos, status de envio/retorno e mensagem enviada.
- `recruitment_settings`: configuracoes operacionais do modulo, como quantidade diaria e horarios.

O SQL tambem cria:

- extensao `pgcrypto`;
- chaves primarias UUID;
- timestamps `created_at` e `updated_at`;
- constraints/checks de status;
- indices para telefone normalizado, status, data de apresentacao, lote e envio;
- RLS habilitado nas quatro tabelas;
- policies basicas comentadas para liberacao futura.

## Variaveis de ambiente

Crie um arquivo `.env.local` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Use os valores do painel do Supabase em Project Settings > API.

Nao coloque chaves reais no repositorio.

## Como aplicar o SQL no Supabase

1. Acesse o painel do Supabase.
2. Abra o projeto correto.
3. Va em SQL Editor.
4. Crie uma nova query.
5. Cole o conteudo de `database/recruitment-schema.sql`.
6. Execute a query.
7. Verifique em Table Editor se as quatro tabelas foram criadas.

## RLS e policies para teste

O schema habilita RLS nas tabelas:

- `recruitment_candidates`
- `recruitment_queue`
- `recruitment_contact_history`
- `recruitment_settings`

As policies estao comentadas no final do SQL. Para um teste autenticado simples, sera necessario descomentar/adaptar policies para `authenticated`.

Antes de liberar em producao, defina:

- quais usuarios podem ler candidatos;
- quais usuarios podem importar/alterar candidatos;
- quem pode gerar fila;
- quem pode registrar historico;
- se havera `organization_id`, `created_by` ou outra coluna de escopo.

## Cuidados antes de producao

- Nao use policies com `using (true)` em producao sem escopo por usuario/organizacao.
- Defina uma estrategia de deduplicacao por `telefone_normalizado` e, se necessario, `email_normalizado`.
- Considere triggers para atualizar `updated_at`.
- Valide os dados no servidor antes de gravar.
- Evite gravar arquivos CSV completos sem necessidade; use `raw` apenas para auditoria controlada.
- Revise retencao de dados pessoais e LGPD.
- Mantenha anon key apenas para operacoes permitidas por RLS.
- Operacoes sensiveis devem passar por API server-side em fase futura.
