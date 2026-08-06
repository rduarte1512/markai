-- MarkAI premium billing update
-- Safe to run multiple times in Neon SQL Editor.

begin;

update plan_catalog
set monthly_credits = 60,
    brand_limit = 1,
    team_limit = 1,
    features = '{"client_portal":false,"reports":false,"seo":false,"social_scheduling":false,"history_days":7,"ads_studio":"essential","copilot":"limited"}'::jsonb
where key = 'free';

-- Keep Free useful for product discovery while protecting paid-model margin.
insert into plan_model_limits (plan_key, model_key, monthly_request_limit) values
  ('free','gpt-5.6-lua',40),
  ('free','qwen-3.7-plus',8),
  ('free','sonnet-5',2),
  ('free','gpt-5.6-terra',2),
  ('free','minimax-3.1',0),
  ('free','gpt-5.5',0),
  ('free','opus-5',0),
  ('free','kimi-2.7',0),
  ('free','glm-5.2',0),
  ('free','fable-5',0),
  ('free','gpt-5.6-sol',0)
on conflict (plan_key, model_key)
do update set monthly_request_limit = excluded.monthly_request_limit;

-- Align current Free wallets without removing purchased extra credits.
update credit_wallets cw
set monthly_allowance = 60,
    monthly_balance = least(cw.monthly_balance, 60),
    updated_at = now()
from workspaces w
where w.id = cw.workspace_id
  and w.plan_key = 'free';

-- Ensure all workspaces have a subscription record for cancellation/status UI.
insert into subscriptions (workspace_id, plan_key, status, provider)
select w.id, w.plan_key, 'active', case when w.plan_key = 'free' then null else 'markai_demo' end
from workspaces w
on conflict (workspace_id) do nothing;

commit;
