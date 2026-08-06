# MarkAI

MarkAI é um MVP de uma plataforma de marketing com IA para agências e freelancers. Foi criado com **Next.js App Router**, **Neon Postgres** e uma arquitetura preparada para deploy na **Vercel**.

## O que está funcional neste MVP

- Landing page responsiva e profissional
- Registo, login, logout e sessões seguras por cookie HTTP-only
- Workspace automático por agência
- Gestão de marcas e Brand Kits
- Onboarding de marca assistido por IA
- Ads Studio para Meta, Google, TikTok e LinkedIn
- Geração de variações A/B e biblioteca persistida no Neon
- Agente de Marketing com contexto da marca e histórico de conversa
- Catálogo de modelos, custos, limites mensais e acesso por plano
- Carteira de créditos com saldo mensal e saldo extra
- Débito atómico de créditos e reembolso automático quando uma geração falha
- Sincronização automática do saldo de créditos na interface
- Dashboard premium com plano, créditos, ritmo, insights e ações rápidas
- Dashboard de consumo por modelo, marca e operação
- Estrutura de dados pronta para funis, conteúdo, SEO, relatórios, portal de cliente, assets e colaboração
- CI no GitHub com typecheck e build

## Stack

- Next.js 16 / React 19 / TypeScript
- Neon Serverless Postgres (`@neondatabase/serverless`)
- Autenticação própria com `jose` e `bcryptjs`
- Lucide Icons
- CSS próprio, sem dependência de um framework visual

## 1. Configurar a base de dados Neon

1. Cria um projeto no Neon.
2. Abre o **SQL Editor**.
3. Copia e executa todo o conteúdo de [`database/schema.sql`](database/schema.sql).
4. Em **Connect**, copia a connection string com pooling. O hostname deverá normalmente conter `-pooler`.

O SQL cria as tabelas, índices, planos, modelos, limites e funções de créditos necessárias.

## 2. Variáveis de ambiente

Copia `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preenche:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DATABASE?sslmode=require
JWT_SECRET=uma-chave-aleatoria-com-pelo-menos-32-caracteres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Gateway de IA opcional

Sem gateway configurado, a aplicação funciona em **modo demonstração** e devolve respostas locais para poderes testar todos os fluxos.

Para ligar modelos reais, usa um endpoint compatível com `/chat/completions`:

```env
AI_GATEWAY_BASE_URL=https://teu-gateway.com/v1
AI_GATEWAY_API_KEY=chave-do-gateway
AI_MODEL_MAP={"gpt-5.6-lua":"id-real-do-modelo","sonnet-5":"id-real-do-modelo"}
```

Os nomes apresentados no MarkAI são chaves de catálogo. Tens de os mapear para IDs realmente disponíveis no fornecedor escolhido.

## 3. Executar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## 4. Deploy na Vercel

1. Importa este repositório na Vercel.
2. Mantém o framework detetado como **Next.js**.
3. Adiciona as variáveis `DATABASE_URL`, `JWT_SECRET` e, opcionalmente, as variáveis do gateway de IA.
4. Faz o deploy.

Não coloques segredos em variáveis com prefixo `NEXT_PUBLIC_`.

## Planos e créditos incluídos

| Plano | Créditos/mês | Marcas | Equipa |
|---|---:|---:|---:|
| Free | 60 | 1 | 1 |
| Starter | 3.000 | 5 | 3 |
| Pro | 12.000 | 20 | 10 |
| Agency | 50.000 | 999 | 50 |

Os utilizadores Free recebem acesso principal aos modelos de baixo consumo e pequenos testes mensais em alguns modelos superiores. Os planos pagos aumentam progressivamente limites e acesso.

## Modelos do catálogo

- Muito baixo: GPT 5.6 Lua
- Baixo: Qwen 3.7 Plus, Sonnet 5, GPT 5.6 Terra
- Médio: Minimax 3.1, GPT 5.5, Opus 5
- Alto: Kimi 2.7, GLM 5.2
- Muito alto: Fable 5, GPT 5.6 Sol

## Estrutura principal

```text
src/app/                 páginas e APIs Next.js
src/components/          componentes de interface
src/lib/                 autenticação, Neon, IA e dados
database/schema.sql      esquema completo para o Neon
.github/workflows/ci.yml validação automática
```

## Próximos módulos recomendados

1. Construtor visual de funis e editor de páginas
2. Conteúdo, calendário editorial e agendamento social
3. Stripe para subscrições e compra de créditos
4. Relatórios automáticos e portal do cliente
5. Assets, comentários, aprovações e permissões de equipa
6. Integrações reais com Meta, Google, TikTok e LinkedIn

## Segurança antes de produção

Este MVP já valida acesso ao workspace nas APIs e usa cookies HTTP-only. Antes de abrir ao público, acrescenta rate limiting, verificação de email, recuperação de palavra-passe, proteção CSRF adicional, logs de auditoria, política de retenção de dados e testes de autorização automatizados.
