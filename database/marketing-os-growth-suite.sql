-- MarkAI Growth OS migration
-- Safe to run after database/schema.sql on an existing Neon database.

begin;

create table if not exists ad_integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null,
  credentials_enc text not null,
  account_label text,
  status text not null default 'configured',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, provider)
);

create table if not exists campaign_snapshots (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  captured_by uuid references users(id) on delete set null,
  provider text not null default 'manual',
  period_start date,
  period_end date,
  spend numeric(14,2) not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  conversions numeric(14,2) not null default 0,
  revenue numeric(14,2) not null default 0,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists social_publications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  content_item_id uuid references content_items(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  provider text not null check (provider in ('instagram','facebook','linkedin','tiktok','x','youtube','other')),
  status text not null default 'draft' check (status in ('draft','scheduled','ready','publishing','published','failed','canceled')),
  scheduled_for timestamptz,
  published_at timestamptz,
  external_id text,
  external_url text,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists client_approvals (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  entity_type text not null check (entity_type in ('ad','content','funnel','campaign','report')),
  entity_id uuid not null,
  status text not null default 'pending' check (status in ('pending','approved','changes_requested')),
  client_name text,
  client_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(brand_id, entity_type, entity_id)
);

create table if not exists funnel_events (
  id bigserial primary key,
  funnel_id uuid not null references funnels(id) on delete cascade,
  step_id uuid references funnel_steps(id) on delete set null,
  session_key text,
  event_type text not null check (event_type in ('view','click','submit','checkout','purchase')),
  variant_key text not null default 'A',
  value numeric(14,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists automation_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  brand_id uuid references brands(id) on delete cascade,
  created_by uuid references users(id) on delete set null,
  name text not null,
  trigger_key text not null check (trigger_key in ('daily_summary','cpa_threshold','content_approved','funnel_dropoff')),
  trigger_config jsonb not null default '{}'::jsonb,
  action_key text not null check (action_key in ('create_report','create_content_idea','create_decision','clone_winning_ad')),
  action_config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  last_run_at timestamptz,
  last_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists search_audits (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  created_by uuid references users(id) on delete set null,
  url text not null,
  keywords jsonb not null default '[]'::jsonb,
  seo_score integer not null default 0 check (seo_score between 0 and 100),
  geo_score integer not null default 0 check (geo_score between 0 and 100),
  metrics jsonb not null default '{}'::jsonb,
  insights text,
  status text not null default 'ready' check (status in ('processing','ready','failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_campaign_snapshots_campaign_date on campaign_snapshots(campaign_id, created_at desc);
create index if not exists idx_social_publications_workspace_date on social_publications(workspace_id, created_at desc);
create index if not exists idx_social_publications_schedule on social_publications(status, scheduled_for);
create index if not exists idx_client_approvals_brand on client_approvals(brand_id, status, created_at desc);
create index if not exists idx_funnel_events_funnel_date on funnel_events(funnel_id, created_at desc);
create index if not exists idx_funnel_events_step on funnel_events(step_id, event_type);
create index if not exists idx_automation_rules_workspace on automation_rules(workspace_id, enabled, updated_at desc);
create index if not exists idx_search_audits_brand_date on search_audits(brand_id, created_at desc);

-- Keep the catalogue aligned with the product UI. Limits are also enforced in application code.
update plan_catalog set
  monthly_credits = 60,
  features = features || '{
    "growth_os": true,
    "campaign_os": "limited",
    "performance_intelligence": "limited",
    "social_publisher": "limited",
    "client_portal": false,
    "reports": "limited",
    "funnel_analytics": "limited",
    "automations": false,
    "search_intelligence_beta": "limited"
  }'::jsonb
where key = 'free';

update plan_catalog set features = features || '{
  "growth_os": true,
  "campaign_os": true,
  "performance_intelligence": true,
  "social_publisher": true,
  "client_portal": true,
  "reports": true,
  "funnel_analytics": true,
  "automations": true,
  "search_intelligence_beta": true
}'::jsonb where key = 'starter';

update plan_catalog set features = features || '{
  "growth_os": true,
  "campaign_os": true,
  "performance_intelligence": true,
  "social_publisher": true,
  "client_portal": true,
  "reports": true,
  "funnel_analytics": true,
  "automations": true,
  "search_intelligence_beta": true
}'::jsonb where key in ('pro','agency');

drop trigger if exists ad_integrations_set_updated_at on ad_integrations;
drop trigger if exists social_publications_set_updated_at on social_publications;
drop trigger if exists client_approvals_set_updated_at on client_approvals;
drop trigger if exists automation_rules_set_updated_at on automation_rules;

create trigger ad_integrations_set_updated_at before update on ad_integrations for each row execute function set_updated_at();
create trigger social_publications_set_updated_at before update on social_publications for each row execute function set_updated_at();
create trigger client_approvals_set_updated_at before update on client_approvals for each row execute function set_updated_at();
create trigger automation_rules_set_updated_at before update on automation_rules for each row execute function set_updated_at();

commit;
