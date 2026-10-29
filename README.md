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

## Fluxo de atendimento

Equipamento recebido → atendimento → checklist de entrada e fotos → diagnóstico → orçamento definitivo → aprovação e conversão em OS → execução e relatório → checklist de saída → retirada/entrega.

- **Novo atendimento** abre a ficha antes da aprovação. Cliente e equipamento podem ser cadastrados no próprio formulário.
- Checklist, anexos, diagnóstico e histórico permanecem no mesmo registro na conversão em OS; o número é preservado.
- O orçamento definitivo exige entrada concluída e diagnóstico. Apenas uma proposta em rascunho, enviada ou aprovada pode existir por atendimento.
- Para equipamento ainda não recebido, use **Novo pré-orçamento**. É uma estimativa sujeita ao diagnóstico presencial e não autoriza execução. Há um atalho para abrir o atendimento a partir dessa estimativa.
- Cada versão do orçamento pode incluir até seis fotos JPEG, PNG ou WebP selecionadas da entrada/diagnóstico. PDF e HEIC/HEIF continuam como anexos internos; para incluí-los como evidência no PDF, envie uma versão JPEG/PNG/WebP.
- Fotos de diagnóstico podem ser adicionadas após concluir a checklist de entrada, até o envio do orçamento. Os itens da checklist concluída continuam imutáveis.
- Orçamentos anteriores à migração mantêm o fluxo original, inclusive propostas já enviadas que ainda aguardam decisão. OS e eventos antigos não são reclassificados.

### Migração e publicação

A migração `20261029120000_intake_before_quote` é aditiva. Acrescenta a identificação de atendimento, a data de conversão, o tipo de orçamento e as referências de fotos por versão, sem reescrever timelines ou decisões antigas.

Execute `npx prisma migrate deploy` no ambiente de destino **antes de publicar a aplicação nova**. A aplicação anterior continua compatível com as colunas adicionais. Depois de migrar e publicar, confira abertura de atendimento, entrada, diagnóstico, orçamento definitivo, aprovação e geração dos PDFs.

### Teste de integração isolado

Use um PostgreSQL local descartável. O teste recusa hosts remotos e bancos cujo nome não termine em `_test`; cria e remove seu próprio schema, aplica as migrations e verifica dados legados, o fluxo completo até a entrega, revisões, fotos, idempotência e a proteção da timeline.

```bash
INTAKE_TEST_DATABASE_URL=postgresql://usuario@127.0.0.1:55439/twoatech_intake_test npm run test:intake
```

## Datas e histórico

Instantes são armazenados no PostgreSQL como `timestamptz` e tratados em UTC. A interface exibe datas em português do Brasil no fuso `America/Sao_Paulo`.

A tabela `service_order_timeline_events` é append-only. A migração inicial instala uma proteção no PostgreSQL contra atualização e exclusão de eventos.
