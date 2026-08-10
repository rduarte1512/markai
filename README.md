# MarkAI

MarkAI é um **Marketing Operating System com IA** para agências, freelancers e equipas de marketing. Foi criado com **Next.js App Router**, **Neon Postgres** e uma arquitetura preparada para deploy na **Vercel**.

## O que está funcional

### Núcleo MarkAI

- Landing page responsiva e profissional
- Registo, login, logout e sessões seguras por cookie HTTP-only
- Workspaces para agências
- Gestão de marcas e Brand Kits
- Onboarding de marca assistido por IA
- Ads Studio para Meta, Google, TikTok e LinkedIn
- Geração de variações A/B e biblioteca persistida no Neon
- Agente de Marketing persistente, multimodal e com contexto da marca
- Geração de imagem e vídeo com limites por plano
- Catálogo de modelos, custos, limites mensais e acesso por plano
- Carteira de créditos com débito atómico e reembolso automático em falhas
- Conteúdo com pipeline editorial e calendário
- Funnel Builder com páginas, formulários, checkout, upsell, email e preview
- Integrações de publicidade com credenciais cifradas
- Billing, checkout, planos e gestão de workspaces
- CI no GitHub com typecheck e build

### Growth OS

O dashboard `/dashboard/growth` fecha o ciclo entre criação, publicação e resultados:

1. **Performance Intelligence** — snapshots de spend, impressões, cliques, conversões e revenue; cálculo de CTR, CPA e ROAS; sincronização por conector nos planos elegíveis.
2. **Campaign OS** — campanhas centralizadas por marca, objetivo, budget, período, canal, estratégia e anúncios associados.
3. **Social Publisher** — fila multicanal, agendamento e publicação live quando existe conector configurado.
4. **Client Portal** — links seguros e expiráveis para clientes verem campanhas/relatórios e aprovarem anúncios ou conteúdos.
5. **Reports** — relatórios quantitativos no Free e insights gerados por IA nos planos elegíveis.
6. **Funnel Analytics + A/B** — tracking de `view`, `click`, `submit`, `checkout` e `purchase`, drop-off por etapa e variantes A/B.
7. **AI Automations** — regras de CPA, conteúdo aprovado, resumo diário e drop-off que podem criar decisões, reports, ideias ou drafts.
8. **Search Intelligence (Beta)** — auditoria SEO on-page + pontuação de GEO readiness. A pontuação GEO mede preparação técnica/conteúdo; não representa ranking real em ChatGPT, Gemini, Perplexity ou outros motores.

## Stack

- Next.js 16 / React 19 / TypeScript
- Neon Serverless Postgres (`@neondatabase/serverless`)
- Autenticação própria com `jose` e `bcryptjs`
- Lucide Icons
- CSS próprio + CSS Modules nos novos módulos

## 1. Configurar a base de dados Neon

### Instalação nova

1. Cria um projeto no Neon.
2. Abre o **SQL Editor**.
3. Executa [`database/schema.sql`](database/schema.sql).
4. Depois executa [`database/marketing-os-growth-suite.sql`](database/marketing-os-growth-suite.sql).
5. Em **Connect**, copia a connection string com pooling. O hostname deverá normalmente conter `-pooler`.

### Instalação existente

Se já tens o MarkAI anterior, executa apenas:

```text
database/marketing-os-growth-suite.sql
```

A migration é preparada para adicionar as tabelas do Growth OS sem apagar os dados existentes.

## 2. Variáveis de ambiente

Copia `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Obrigatórias:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DATABASE?sslmode=require
JWT_SECRET=uma-chave-aleatoria-com-pelo-menos-32-caracteres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Gateway de IA opcional

Sem gateway configurado, a aplicação mantém o modo de demonstração já existente para os fluxos de IA.

```env
AI_GATEWAY_BASE_URL=https://teu-gateway.com/v1
AI_GATEWAY_API_KEY=chave-do-gateway
AI_MODEL_MAP={"gpt-5.6-lua":"id-real-do-modelo","sonnet-5":"id-real-do-modelo"}
```

Os Reports e o Search Intelligence avançado usam o sistema normal de créditos. Quando a geração falha depois de cobrar créditos, o MarkAI tenta efetuar o reembolso automaticamente.

### Integrações e conectores live

As credenciais adicionadas em **Definições → Integrações** continuam cifradas. Em produção é recomendado definir uma chave dedicada:

```env
INTEGRATIONS_ENCRYPTION_KEY=uma-chave-longa-e-aleatoria
```

Performance sync e publicação social foram implementados com uma interface de conector explícita. O MarkAI **não simula** uma publicação ou sincronização bem-sucedida quando não existe conector real.

```env
PERFORMANCE_SYNC_WEBHOOK_URL=https://teu-servico.example/sync-performance
PERFORMANCE_SYNC_WEBHOOK_SECRET=segredo-opcional
SOCIAL_PUBLISH_WEBHOOK_URL=https://teu-servico.example/publish-social
SOCIAL_PUBLISH_WEBHOOK_SECRET=segredo-opcional
```

O serviço de sync deve devolver:

```json
{
  "snapshots": [
    {
      "spend": 120.5,
      "impressions": 12000,
      "clicks": 620,
      "conversions": 31,
      "revenue": 890
    }
  ]
}
```

O serviço de publicação deve devolver, quando disponível:

```json
{
  "externalId": "post-id",
  "externalUrl": "https://plataforma.example/post-id"
}
```

### Automations agendadas

O endpoint `/api/automations/run` é protegido por `CRON_SECRET`:

```env
CRON_SECRET=uma-chave-aleatoria-com-pelo-menos-16-caracteres
```

O `vercel.json` agenda uma execução diária às **08:00 UTC**. A execução manual de uma regra continua disponível no Growth OS.

## 3. Executar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

Validação local recomendada antes de publicar:

```bash
npm run typecheck
npm run build
```

## 4. Deploy na Vercel

1. Importa este repositório na Vercel.
2. Mantém o framework detetado como **Next.js**.
3. Adiciona `DATABASE_URL`, `JWT_SECRET` e `CRON_SECRET`.
4. Adiciona as variáveis do gateway de IA e dos conectores se os fores utilizar.
5. Executa a migration do Growth OS no Neon antes de ativar os módulos novos em produção.
6. Faz o deploy.

A produção continua a ser publicada a partir da branch `main`. O `vercel.json` atual ignora previews de branches que não sejam `main`; por isso a validação desta feature é feita no GitHub Actions antes do merge.

Não coloques segredos em variáveis com prefixo `NEXT_PUBLIC_`.

## Planos e limites Growth OS

| Recurso | Free | Starter | Pro | Agency |
|---|---:|---:|---:|---:|
| Créditos/mês | 60 | 3.000 | 12.000 | 50.000 |
| Marcas | 1 | 5 | 20 | sem limite prático |
| Campanhas ativas | 1 | 10 | 50 | sem limite prático |
| Performance | 7 dias / 8 snapshots | 90 dias / 250 | 365 dias / 2.500 | 730 dias / escala |
| Publisher/mês | 3, sem live | 50 | 250 | 2.000 |
| Client Portals | — | 5 | 25 | sem limite prático |
| Reports/mês | 1 básico | 10 com IA | 50 com IA | escala |
| Funnel Analytics | 1 funil | 10 | avançado | escala |
| Automations ativas | — | 3 | 25 | 100 |
| Search Intelligence Beta/mês | 1 básico | 5 com IA | 30 com IA | 200 com IA |

O objetivo do Free é permitir testar o fluxo com limites baixos. As funcionalidades de maior valor operacional — Client Portal, Automations, publicação live/sync e insights avançados com IA — começam nos planos pagos.

## Modelos do catálogo

- Muito baixo: GPT 5.6 Lua
- Baixo: Qwen 3.7 Plus, Sonnet 5, GPT 5.6 Terra
- Médio: Minimax 3.1, GPT 5.5, Opus 5
- Alto: Kimi 2.7, GLM 5.2
- Muito alto: Fable 5, GPT 5.6 Sol

## Estrutura principal

```text
src/app/                              páginas e APIs Next.js
src/app/(dashboard)/dashboard/growth Growth OS
src/app/portal/[token]                portal público de cliente
src/components/                       componentes de interface
src/lib/                              auth, Neon, IA, planos e motores Growth
database/schema.sql                   esquema base
database/marketing-os-growth-suite.sql migration Growth OS
.github/workflows/ci.yml              typecheck + build em Pull Requests
```

## Endpoints Growth OS principais

```text
POST /api/growth/campaigns
POST /api/growth/performance
POST /api/growth/publisher
POST /api/growth/clients
POST /api/growth/reports
POST /api/growth/funnels
POST /api/growth/automations
POST /api/growth/search
POST /api/track/funnel
GET  /api/automations/run
POST /api/portal/[token]
```

## Segurança antes de produção pública

A feature inclui validação de workspace/plano no backend, credenciais de integrações cifradas, portal por token e proteção SSRF no Search Intelligence, incluindo validação dos redirects. Ainda é recomendado acrescentar rate limiting distribuído, verificação de email, recuperação de palavra-passe, proteção CSRF adicional, logs de auditoria, política de retenção de dados e testes de autorização automatizados antes de uma abertura pública em grande escala.
