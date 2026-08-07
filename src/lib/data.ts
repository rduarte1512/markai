import { getSql } from "@/lib/db";
import { getBillingWorkspaceForWorkspace } from "@/lib/workspaces";
import type { Brand, ModelAccess } from "@/lib/types";

export async function getBrands(workspaceId: string): Promise<Brand[]> {
  const sql = getSql();
  return (await sql`
    select id, name, slug, industry, website, description, audience,
      tone_of_voice, primary_color, secondary_color,
      onboarding_completed, created_at
    from brands
    where workspace_id = ${workspaceId} and status = 'active'
    order by created_at desc
  `) as unknown as Brand[];
}

export async function getBrand(workspaceId: string, brandId: string): Promise<Brand | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, name, slug, industry, website, description, audience,
      tone_of_voice, primary_color, secondary_color,
      onboarding_completed, created_at
    from brands
    where workspace_id = ${workspaceId} and id = ${brandId}
    limit 1
  `) as unknown as Brand[];
  return rows[0] ?? null;
}

export async function getModels(workspaceId: string): Promise<ModelAccess[]> {
  const sql = getSql();
  const billing = await getBillingWorkspaceForWorkspace(workspaceId);
  const billingWorkspaceId = billing?.billing_workspace_id || workspaceId;
  return (await sql`
    with workspace_plan as (
      select plan_key from workspaces where id = ${billingWorkspaceId}
    ), monthly_usage as (
      select model_key, count(*)::int as requests_used
      from credit_ledger
      where workspace_id = ${billingWorkspaceId}
        and entry_type = 'usage'
        and created_at >= date_trunc('month', now())
      group by model_key
    )
    select
      m.key,
      m.display_name,
      m.consumption_group,
      m.credit_cost,
      m.description,
      pml.monthly_request_limit,
      coalesce(mu.requests_used, 0) as monthly_requests_used,
      (pml.monthly_request_limit > coalesce(mu.requests_used, 0)) as available
    from model_catalog m
    cross join workspace_plan wp
    join plan_model_limits pml on pml.model_key = m.key and pml.plan_key = wp.plan_key
    left join monthly_usage mu on mu.model_key = m.key
    where m.active = true
    order by m.sort_order
  `) as unknown as ModelAccess[];
}

export async function getDashboardStats(workspaceId: string) {
  const sql = getSql();
  const billing = await getBillingWorkspaceForWorkspace(workspaceId);
  const billingWorkspaceId = billing?.billing_workspace_id || workspaceId;
  const [summary, activity, byModel] = await Promise.all([
    sql`
      select
        (select count(*)::int from brands where workspace_id = ${workspaceId} and status = 'active') as brands,
        (select count(*)::int from campaigns c join brands b on b.id = c.brand_id where b.workspace_id = ${workspaceId}) as campaigns,
        (select count(*)::int from ads a join brands b on b.id = a.brand_id where b.workspace_id = ${workspaceId}) as ads,
        (select coalesce(sum(-credits_delta), 0)::int from credit_ledger where workspace_id = ${billingWorkspaceId} and entry_type = 'usage' and created_at >= date_trunc('month', now())) as credits_used
    `,
    sql`
      select cl.id, cl.operation, cl.model_key, cl.credits_delta, cl.created_at,
        b.name as brand_name, m.display_name as model_name
      from credit_ledger cl
      left join brands b on b.id = cl.brand_id
      left join model_catalog m on m.key = cl.model_key
      where cl.workspace_id = ${billingWorkspaceId}
      order by cl.created_at desc
      limit 8
    `,
    sql`
      select coalesce(m.display_name, cl.model_key, 'Outros') as label,
        coalesce(sum(-cl.credits_delta), 0)::int as credits
      from credit_ledger cl
      left join model_catalog m on m.key = cl.model_key
      where cl.workspace_id = ${billingWorkspaceId}
        and cl.entry_type = 'usage'
        and cl.created_at >= date_trunc('month', now())
      group by m.display_name, cl.model_key
      order by credits desc
      limit 6
    `,
  ]);

  return {
    summary: (summary[0] ?? { brands: 0, campaigns: 0, ads: 0, credits_used: 0 }) as {
      brands: number;
      campaigns: number;
      ads: number;
      credits_used: number;
    },
    activity: activity as unknown as Array<{
      id: string;
      operation: string;
      model_key: string | null;
      credits_delta: number;
      created_at: string;
      brand_name: string | null;
      model_name: string | null;
    }>,
    byModel: byModel as unknown as Array<{ label: string; credits: number }>,
  };
}

export async function getCreditHistory(workspaceId: string) {
  const sql = getSql();
  const billing = await getBillingWorkspaceForWorkspace(workspaceId);
  const billingWorkspaceId = billing?.billing_workspace_id || workspaceId;
  return (await sql`
    select cl.id, cl.entry_type, cl.operation, cl.credits_delta,
      cl.balance_after, cl.created_at, b.name as brand_name,
      m.display_name as model_name
    from credit_ledger cl
    left join brands b on b.id = cl.brand_id
    left join model_catalog m on m.key = cl.model_key
    where cl.workspace_id = ${billingWorkspaceId}
    order by cl.created_at desc
    limit 50
  `) as unknown as Array<{
    id: string;
    entry_type: string;
    operation: string;
    credits_delta: number;
    balance_after: number;
    created_at: string;
    brand_name: string | null;
    model_name: string | null;
  }>;
}
