# Imob Intelligence CRM

Plataforma SaaS de inteligência imobiliária para análise preditiva de corretores, clientes, leads, pastas, aprovação bancária e conversão histórica.

## Stack

- Frontend: Next.js, React, Tailwind CSS, Recharts
- Backend: rotas REST no App Router do Next.js
- Banco: PostgreSQL/Supabase em `database/schema.sql`
- IA: motor Python inicial em `ml/predictive_engine.py`

## Rodar localmente

```bash
npm install
npm run dev
```

## Módulos

- Dashboard Executivo
- Cadastro e análise de corretores
- Cadastro e análise de clientes
- Gestão de pastas
- Sistema de score IPC
- Sistema preditivo
- Banco histórico
- Relatórios inteligentes
- Funil comercial
- Heatmaps
- Inteligência de conversão
- Gestão de leads
- Painel do cliente
- Painel do corretor
- Aprovação bancária

## LGPD

O frontend nunca exibe CPF completo. A estrutura SQL prevê `cpf_encrypted`, `cpf_hash`, permissões por perfil e políticas RLS para Supabase.
