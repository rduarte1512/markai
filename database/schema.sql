-- MarkAI MVP database schema for Neon Postgres
-- Run this entire file in Neon SQL Editor on a new database.

begin;

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plan_catalog (
  key text primary key,
  name text not null,
  monthly_credits integer not null check (monthly_credits >= 0),
  brand_limit integer not null check (brand_limit >= 1),
  team_limit integer not null check (team_limit >= 1),
  features jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists model_catalog (
  key text primary key,
  display_name text not null,
  consumption_group text not null check (consumption_group in ('very_low','low','medium','high','very_high')),
  credit_cost integer not null check (credit_cost > 0),
  provider text not null default 'gateway',
  provider_model_id text,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists plan_model_limits (
  plan_key text not null references plan_catalog(key) on delete cascade,
  model_key text not null references model_catalog(key) on delete cascade,
  monthly_request_limit integer not null check (monthly_request_limit >= 0),
  primary key (plan_key, model_key)
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  plan_key text not null default 'free' references plan_catalog(key),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','strategist','creator','viewer','client')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  plan_key text not null references plan_catalog(key),
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled','incomplete')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz not null default date_trunc('month', now()),
  current_period_end timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists credit_wallets (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  monthly_balance integer not null default 0 check (monthly_balance >= 0),
  extra_balance integer not null default 0 check (extra_balance >= 0),
  monthly_allowance integer not null default 0 check (monthly_allowance >= 0),
  period_start timestamptz not null default date_trunc('month', now()),
  period_end timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  updated_at timestamptz not null default now()
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  industry text,
  website text,
  description text,
  audience text,
  tone_of_voice text,
  primary_color text default '#7C3AED',
  secondary_color text default '#22D3EE',
  personas jsonb not null default '[]'::jsonb,
  values jsonb not null default '[]'::jsonb,
  competitors jsonb not null default '[]'::jsonb,
  onboarding_completed boolean not null default false,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists brand_assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  uploaded_by uuid references users(id) on delete set null,
  name text not null,
  asset_type text not null check (asset_type in ('image','video','document','logo','font','other')),
  url text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  created_by uuid references users(id) on delete set null,
  name text not null,
  objective text,
  channel text,
  status text not null default 'draft' check (status in ('draft','active','paused','completed','archived')),
  budget numeric(12,2),
  start_date date,
  end_date date,
  strategy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ads (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  platform text not null check (platform in ('meta','google','tiktok','linkedin','other')),
  model_key text references model_catalog(key),
  title text,
  primary_text text not null,
  description text,
  cta text,
  creative_url text,
  variant_label text,
  generation_prompt text,
  status text not null default 'draft' check (status in ('draft','approved','rejected','published','archived')),
  performance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists funnels (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  created_by uuid references users(id) on delete set null,
  name text not null,
  template_key text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists funnel_steps (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references funnels(id) on delete cascade,
  step_type text not null check (step_type in ('landing','form','checkout','upsell','downsell','thank_you','email')),
  title text not null,
  position integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  created_by uuid references users(id) on delete set null,
  title text not null,
  content_type text not null check (content_type in ('post','reel','story','article','email','seo_brief','other')),
  channel text,
  body text,
  status text not null default 'idea' check (status in ('idea','draft','review','approved','scheduled','published','archived')),
  scheduled_for timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  brand_id uuid references brands(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('system','user','assistant')),
  content text not null,
  model_key text references model_catalog(key),
  credits_used integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists brand_decisions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  title text not null,
  decision text not null,
  rationale text,
  outcome text,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  created_by uuid references users(id) on delete set null,
  title text not null,
  period_start date,
  period_end date,
  metrics jsonb not null default '{}'::jsonb,
  ai_insights text,
  status text not null default 'draft' check (status in ('draft','ready','shared','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists client_portal_links (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  label text,
  expires_at timestamptz,
  active boolean not null default true,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists team_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  brand_id uuid references brands(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  body text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists credit_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  model_key text references model_catalog(key),
  entry_type text not null check (entry_type in ('usage','purchase','monthly_reset','refund','manual_adjustment')),
  operation text not null,
  credits_delta integer not null,
  balance_after integer not null check (balance_after >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_members_user on workspace_members(user_id);
create index if not exists idx_brands_workspace on brands(workspace_id, created_at desc);
create index if not exists idx_ads_brand on ads(brand_id, created_at desc);
create index if not exists idx_campaigns_brand on campaigns(brand_id, created_at desc);
create index if not exists idx_content_brand_schedule on content_items(brand_id, scheduled_for);
create index if not exists idx_credit_ledger_workspace_date on credit_ledger(workspace_id, created_at desc);
create index if not exists idx_credit_ledger_model_date on credit_ledger(workspace_id, model_key, created_at desc);
create index if not exists idx_ai_conversations_workspace on ai_conversations(workspace_id, updated_at desc);
create index if not exists idx_ai_messages_conversation on ai_messages(conversation_id, created_at);

insert into plan_catalog (key, name, monthly_credits, brand_limit, team_limit, sort_order, features) values
  ('free', 'Free', 120, 1, 1, 10, '{"client_portal":false,"reports":false,"seo":false,"social_scheduling":false}'::jsonb),
  ('starter', 'Starter', 3000, 5, 3, 20, '{"client_portal":true,"reports":true,"seo":true,"social_scheduling":false}'::jsonb),
  ('pro', 'Pro', 12000, 20, 10, 30, '{"client_portal":true,"reports":true,"seo":true,"social_scheduling":true}'::jsonb),
  ('agency', 'Agency', 50000, 999, 50, 40, '{"client_portal":true,"reports":true,"seo":true,"social_scheduling":true,"white_label":true}'::jsonb)
on conflict (key) do update set
  name = excluded.name,
  monthly_credits = excluded.monthly_credits,
  brand_limit = excluded.brand_limit,
  team_limit = excluded.team_limit,
  features = excluded.features,
  sort_order = excluded.sort_order;

insert into model_catalog (key, display_name, consumption_group, credit_cost, description, sort_order) values
  ('gpt-5.6-lua', 'GPT 5.6 Lua', 'very_low', 1, 'Modelo rápido e económico para tarefas do dia a dia.', 10),
  ('qwen-3.7-plus', 'Qwen 3.7 Plus', 'low', 2, 'Bom equilíbrio para geração de conteúdo e pesquisa.', 20),
  ('sonnet-5', 'Sonnet 5', 'low', 3, 'Modelo premium eficiente para copy e estratégia.', 30),
  ('gpt-5.6-terra', 'GPT 5.6 Terra', 'low', 3, 'Modelo equilibrado para fluxos de marketing mais exigentes.', 40),
  ('minimax-3.1', 'Minimax 3.1', 'medium', 5, 'Modelo intermédio para campanhas e documentos maiores.', 50),
  ('gpt-5.5', 'GPT 5.5', 'medium', 6, 'Modelo avançado para raciocínio e criação consistente.', 60),
  ('opus-5', 'Opus 5', 'medium', 7, 'Modelo premium para estratégia, análise e copy de alta qualidade.', 70),
  ('kimi-2.7', 'Kimi 2.7', 'high', 10, 'Modelo de alto consumo para contexto e análise profunda.', 80),
  ('glm-5.2', 'GLM 5.2', 'high', 10, 'Modelo de alto consumo para tarefas complexas.', 90),
  ('fable-5', 'Fable 5', 'very_high', 12, 'Modelo de consumo muito elevado para entregáveis premium.', 100),
  ('gpt-5.6-sol', 'GPT 5.6 Sol', 'very_high', 14, 'Modelo topo de gama para trabalhos críticos e extensos.', 110)
on conflict (key) do update set
  display_name = excluded.display_name,
  consumption_group = excluded.consumption_group,
  credit_cost = excluded.credit_cost,
  description = excluded.description,
  sort_order = excluded.sort_order;

-- 0 means blocked. Free users receive small trial limits on selected better models.
insert into plan_model_limits (plan_key, model_key, monthly_request_limit) values
  ('free','gpt-5.6-lua',80), ('free','qwen-3.7-plus',30), ('free','sonnet-5',8), ('free','gpt-5.6-terra',5),
  ('free','minimax-3.1',2), ('free','gpt-5.5',2), ('free','opus-5',1), ('free','kimi-2.7',0), ('free','glm-5.2',0), ('free','fable-5',0), ('free','gpt-5.6-sol',0),
  ('starter','gpt-5.6-lua',1200), ('starter','qwen-3.7-plus',700), ('starter','sonnet-5',500), ('starter','gpt-5.6-terra',500),
  ('starter','minimax-3.1',100), ('starter','gpt-5.5',80), ('starter','opus-5',40), ('starter','kimi-2.7',10), ('starter','glm-5.2',10), ('starter','fable-5',4), ('starter','gpt-5.6-sol',3),
  ('pro','gpt-5.6-lua',5000), ('pro','qwen-3.7-plus',3000), ('pro','sonnet-5',2500), ('pro','gpt-5.6-terra',2500),
  ('pro','minimax-3.1',1200), ('pro','gpt-5.5',1000), ('pro','opus-5',800), ('pro','kimi-2.7',300), ('pro','glm-5.2',300), ('pro','fable-5',150), ('pro','gpt-5.6-sol',120),
  ('agency','gpt-5.6-lua',20000), ('agency','qwen-3.7-plus',12000), ('agency','sonnet-5',10000), ('agency','gpt-5.6-terra',10000),
  ('agency','minimax-3.1',6000), ('agency','gpt-5.5',5000), ('agency','opus-5',4000), ('agency','kimi-2.7',2000), ('agency','glm-5.2',2000), ('agency','fable-5',1200), ('agency','gpt-5.6-sol',1000)
on conflict (plan_key, model_key) do update set monthly_request_limit = excluded.monthly_request_limit;

create or replace function register_markai_user(
  p_name text,
  p_email text,
  p_password_hash text,
  p_workspace_name text
)
returns table(user_id uuid, workspace_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_workspace_id uuid;
  v_slug text;
  v_credits integer;
begin
  if exists (select 1 from users where lower(email) = lower(trim(p_email))) then
    raise exception 'EMAIL_ALREADY_EXISTS';
  end if;

  insert into users(name, email, password_hash)
  values (trim(p_name), lower(trim(p_email)), p_password_hash)
  returning id into v_user_id;

  v_slug := regexp_replace(lower(trim(p_workspace_name)), '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into workspaces(owner_id, name, slug, plan_key)
  values (v_user_id, trim(p_workspace_name), v_slug, 'free')
  returning id into v_workspace_id;

  insert into workspace_members(workspace_id, user_id, role)
  values (v_workspace_id, v_user_id, 'owner');

  insert into subscriptions(workspace_id, plan_key, status)
  values (v_workspace_id, 'free', 'active');

  select monthly_credits into v_credits from plan_catalog where key = 'free';

  insert into credit_wallets(workspace_id, monthly_balance, monthly_allowance)
  values (v_workspace_id, v_credits, v_credits);

  insert into credit_ledger(workspace_id, user_id, entry_type, operation, credits_delta, balance_after, metadata)
  values (v_workspace_id, v_user_id, 'monthly_reset', 'signup_bonus', v_credits, v_credits, '{"source":"registration"}'::jsonb);

  return query select v_user_id, v_workspace_id;
end;
$$;

create or replace function ensure_monthly_credit_reset(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_allowance integer;
  v_extra integer;
  v_total integer;
begin
  select plan_key into v_plan from workspaces where id = p_workspace_id;
  if v_plan is null then
    raise exception 'WORKSPACE_NOT_FOUND';
  end if;

  select monthly_credits into v_allowance from plan_catalog where key = v_plan;

  update credit_wallets
  set monthly_balance = v_allowance,
      monthly_allowance = v_allowance,
      period_start = date_trunc('month', now()),
      period_end = date_trunc('month', now()) + interval '1 month',
      updated_at = now()
  where workspace_id = p_workspace_id
    and period_end <= now()
  returning extra_balance, monthly_balance + extra_balance into v_extra, v_total;

  if found then
    insert into credit_ledger(workspace_id, entry_type, operation, credits_delta, balance_after, metadata)
    values (p_workspace_id, 'monthly_reset', 'monthly_allowance', v_allowance, v_total, jsonb_build_object('plan', v_plan));
  end if;
end;
$$;

create or replace function consume_markai_credits(
  p_workspace_id uuid,
  p_user_id uuid,
  p_brand_id uuid,
  p_model_key text,
  p_operation text,
  p_quantity integer default 1,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_cost_each integer;
  v_cost integer;
  v_limit integer;
  v_used integer;
  v_monthly integer;
  v_extra integer;
  v_take_monthly integer;
  v_remaining integer;
  v_total integer;
begin
  if p_quantity < 1 then
    raise exception 'INVALID_QUANTITY';
  end if;

  select w.plan_key into v_plan
  from workspaces w
  join workspace_members wm on wm.workspace_id = w.id
  where w.id = p_workspace_id and wm.user_id = p_user_id;

  if v_plan is null then
    raise exception 'WORKSPACE_ACCESS_DENIED';
  end if;

  select m.credit_cost, pml.monthly_request_limit
    into v_cost_each, v_limit
  from model_catalog m
  join plan_model_limits pml on pml.model_key = m.key and pml.plan_key = v_plan
  where m.key = p_model_key and m.active = true;

  if v_cost_each is null or v_limit is null or v_limit = 0 then
    raise exception 'MODEL_NOT_AVAILABLE_FOR_PLAN';
  end if;

  select count(*)::integer into v_used
  from credit_ledger
  where workspace_id = p_workspace_id
    and model_key = p_model_key
    and entry_type = 'usage'
    and created_at >= date_trunc('month', now());

  if v_used >= v_limit then
    raise exception 'MODEL_MONTHLY_LIMIT_REACHED';
  end if;

  perform ensure_monthly_credit_reset(p_workspace_id);

  select monthly_balance, extra_balance
    into v_monthly, v_extra
  from credit_wallets
  where workspace_id = p_workspace_id
  for update;

  v_cost := v_cost_each * p_quantity;

  if coalesce(v_monthly, 0) + coalesce(v_extra, 0) < v_cost then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  v_take_monthly := least(v_monthly, v_cost);
  v_remaining := v_cost - v_take_monthly;

  update credit_wallets
  set monthly_balance = monthly_balance - v_take_monthly,
      extra_balance = extra_balance - v_remaining,
      updated_at = now()
  where workspace_id = p_workspace_id
  returning monthly_balance + extra_balance into v_total;

  insert into credit_ledger(
    workspace_id, brand_id, user_id, model_key, entry_type,
    operation, credits_delta, balance_after, metadata
  ) values (
    p_workspace_id, p_brand_id, p_user_id, p_model_key, 'usage',
    p_operation, -v_cost, v_total,
    p_metadata || jsonb_build_object('quantity', p_quantity, 'cost_each', v_cost_each, 'plan', v_plan)
  );

  return jsonb_build_object(
    'credits_used', v_cost,
    'balance_remaining', v_total,
    'monthly_requests_used', v_used + 1,
    'monthly_request_limit', v_limit
  );
end;
$$;

create or replace function refund_markai_credits(
  p_workspace_id uuid,
  p_user_id uuid,
  p_model_key text,
  p_amount integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  if p_amount <= 0 then
    raise exception 'INVALID_REFUND_AMOUNT';
  end if;

  if not exists (
    select 1 from workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id
  ) then
    raise exception 'WORKSPACE_ACCESS_DENIED';
  end if;

  update credit_wallets
  set extra_balance = extra_balance + p_amount,
      updated_at = now()
  where workspace_id = p_workspace_id
  returning monthly_balance + extra_balance into v_total;

  insert into credit_ledger(workspace_id, user_id, model_key, entry_type, operation, credits_delta, balance_after, metadata)
  values (p_workspace_id, p_user_id, p_model_key, 'refund', 'generation_refund', p_amount, v_total, jsonb_build_object('reason', p_reason));

  return jsonb_build_object('refunded', p_amount, 'balance_remaining', v_total);
end;
$$;

create or replace function purchase_markai_credits(
  p_workspace_id uuid,
  p_amount integer,
  p_reference text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  if p_amount <= 0 then
    raise exception 'INVALID_PURCHASE_AMOUNT';
  end if;

  update credit_wallets
  set extra_balance = extra_balance + p_amount,
      updated_at = now()
  where workspace_id = p_workspace_id
  returning monthly_balance + extra_balance into v_total;

  insert into credit_ledger(workspace_id, entry_type, operation, credits_delta, balance_after, metadata)
  values (p_workspace_id, 'purchase', 'extra_credit_purchase', p_amount, v_total, p_metadata || jsonb_build_object('reference', p_reference));

  return jsonb_build_object('credits_added', p_amount, 'balance_remaining', v_total);
end;
$$;

drop trigger if exists users_set_updated_at on users;
drop trigger if exists workspaces_set_updated_at on workspaces;
drop trigger if exists subscriptions_set_updated_at on subscriptions;
drop trigger if exists brands_set_updated_at on brands;
drop trigger if exists campaigns_set_updated_at on campaigns;
drop trigger if exists ads_set_updated_at on ads;
drop trigger if exists funnels_set_updated_at on funnels;
drop trigger if exists funnel_steps_set_updated_at on funnel_steps;
drop trigger if exists content_items_set_updated_at on content_items;
drop trigger if exists ai_conversations_set_updated_at on ai_conversations;
drop trigger if exists reports_set_updated_at on reports;

create trigger users_set_updated_at before update on users for each row execute function set_updated_at();
create trigger workspaces_set_updated_at before update on workspaces for each row execute function set_updated_at();
create trigger subscriptions_set_updated_at before update on subscriptions for each row execute function set_updated_at();
create trigger brands_set_updated_at before update on brands for each row execute function set_updated_at();
create trigger campaigns_set_updated_at before update on campaigns for each row execute function set_updated_at();
create trigger ads_set_updated_at before update on ads for each row execute function set_updated_at();
create trigger funnels_set_updated_at before update on funnels for each row execute function set_updated_at();
create trigger funnel_steps_set_updated_at before update on funnel_steps for each row execute function set_updated_at();
create trigger content_items_set_updated_at before update on content_items for each row execute function set_updated_at();
create trigger ai_conversations_set_updated_at before update on ai_conversations for each row execute function set_updated_at();
create trigger reports_set_updated_at before update on reports for each row execute function set_updated_at();

commit;
