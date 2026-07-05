# Status do MVP de Recrutamento

Este documento resume o estado atual do MVP de Recrutamento do Home Life CRM.

## O que ja funciona

- Importacao manual de CSV no frontend.
- Importacao de candidatos via Google Sheets pelo endpoint `/api/recruitment/import-sheet`.
- Persistencia gradual em Supabase com fallback local.
- Dashboard de recrutamento com indicadores operacionais.
- Candidatos com funil manual e historico de alteracoes.
- Fila de envio com geracao diaria, limites e protecao contra reenvio.
- Envio manual de WhatsApp, um candidato por clique.
- Historico de contatos com origem, template e `messageId` quando existir.
- Configuracoes de recrutamento com persistencia.
- Apresentacoes/turmas com candidatos vinculados e status de participacao.
- Operacao do Dia para acompanhamento manual.
- Relatorios com cards, taxas, analise por fonte e analise por apresentacao.

## Variaveis de ambiente

Configure as variaveis abaixo no ambiente local e na Vercel, sem commitar valores reais:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SHEET_IMPORT_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_API_VERSION=
WHATSAPP_DRY_RUN=
WHATSAPP_TEMPLATE_NAME=
WHATSAPP_TEMPLATE_LANGUAGE=
```

## Tabelas Supabase usadas

- `recruitment_candidates`
- `recruitment_queue`
- `recruitment_contact_history`
- `recruitment_settings`
- `recruitment_presentations`
- `recruitment_presentation_candidates`

## Fluxos principais

1. Google Sheets envia candidatos para `/api/recruitment/import-sheet`.
2. O CRM carrega candidatos, fila, historico, configuracoes e apresentacoes do Supabase.
3. A equipe gera a fila do dia manualmente.
4. A equipe envia WhatsApp manualmente para um candidato por clique.
5. O historico registra envios, alteracoes manuais de funil e participacao em apresentacoes.
6. A equipe atualiza manualmente o funil conforme resposta do candidato.
7. A equipe cria apresentacoes e vincula candidatos.
8. Operacao do Dia e Relatorios usam os dados ja existentes para acompanhamento.

## Endpoints principais

- `POST /api/recruitment/import-sheet`
  - Recebe candidatos da planilha.
  - Exige header `x-import-secret`.
  - Valida `nome`, `telefone` e `fonte`.
  - Evita duplicidade por telefone normalizado.

- `POST /api/recruitment/send-whatsapp`
  - Envia mensagem pelo WhatsApp Cloud API em modo manual.
  - Usa whitelist de templates permitidos.
  - Bloqueia templates marcados como `em_analise`.
  - Nao deve expor token em logs ou respostas.

## Limitacoes atuais

- As policies RLS usadas no MVP sao temporarias e precisam ser endurecidas antes da producao final.
- O token/numeracao do WhatsApp ainda deve ser revisado quando o chip oficial da Home Life estiver totalmente configurado.
- O envio de WhatsApp e manual, sem automacao e sem envio em massa.
- Templates extras dependem de aprovacao da Meta antes de serem liberados.
- O filtro de periodo dos relatorios usa eventos existentes, como historico e apresentacoes; candidatos ainda nao tem data estruturada de cadastro no tipo do frontend.
- O `localStorage` ainda existe como cache/fallback.

## Proximos passos antes da producao final

- Trocar policies MVP por RLS segura com autenticacao, roles e escopo por usuario ou organizacao.
- Revisar LGPD, retencao de dados e permissao de acesso a dados pessoais.
- Validar token permanente, Phone Number ID e chip oficial do WhatsApp.
- Ativar apenas templates Meta aprovados.
- Revisar logs de producao para garantir que nao exponham dados sensiveis.
- Definir rotina operacional para tratamento de erros de envio e candidatos duplicados.
- Considerar coluna estruturada de data de cadastro do candidato para relatorios por periodo mais precisos.
