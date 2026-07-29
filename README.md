# TwoATech OS

Sistema interno da TwoATech para administrar o fluxo de uma assistência técnica especializada em computadores e notebooks.

O projeto substitui planilhas, documentos Word e PDFs manuais por uma operação simples e rastreável, do recebimento do equipamento até a entrega.

## Stack

- Next.js 16 com App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Prisma ORM 7
- PostgreSQL hospedado no Supabase
- React Hook Form e Zod
- NextAuth.js
- Lucide Icons

## Configuração local

1. Copie `.env.example` para `.env`.
2. No painel do Supabase, abra **Connect** e copie as conexões do Supavisor.
3. Use o Transaction Pooler, porta `6543`, em `DATABASE_URL` para a aplicação.
4. Use o Session Pooler, porta `5432`, em `DIRECT_URL` para migrations, seed e Prisma Studio.
5. Gere um segredo forte para `AUTH_SECRET`.
6. Defina nome, e-mail e senha do primeiro usuário nas variáveis `ADMIN_*`.
7. Execute as migrações e o seed.

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

O Supabase é usado como PostgreSQL gerenciado. A aplicação continua acessando os dados exclusivamente pelo Prisma e mantém o NextAuth para autenticação interna; não é necessário adicionar `supabase-js` ou Supabase Auth ao MVP.

## Comandos de qualidade

```bash
npm run typecheck
npm run lint
npm run build
```

## Escopo do MVP

- Dashboard
- Clientes
- Equipamentos
- Ordens de Serviço
- Orçamentos
- Checklist de Entrada e Saída
- Diagnóstico
- Tabela de Serviços
- PDFs
- Histórico imutável das Ordens de Serviço

Não fazem parte do MVP: estoque, financeiro, emissão de nota, WhatsApp, portal do cliente, multiempresa ou um ERP genérico.

## Datas e histórico

Instantes são armazenados no PostgreSQL como `timestamptz` e tratados em UTC. A interface exibe datas em português do Brasil no fuso `America/Sao_Paulo`.

A tabela `service_order_timeline_events` é append-only. A migração inicial instala uma proteção no PostgreSQL contra atualização e exclusão de eventos.
