import { getSql } from "@/lib/db";
import type { PlanKey } from "@/lib/types";

export const WORKSPACE_LIMITS: Record<PlanKey, number> = {
  free: 1,
  starter: 2,
  pro: 5,
  agency: 15,
};

export function getWorkspaceLimit(planKey: PlanKey) {
  return WORKSPACE_LIMITS[planKey] ?? 1;
}

export async function getBillingWorkspaceForUser(userId: string, currentWorkspaceId: string) {
  const sql = getSql();
  const rows = (await sql`
    select
      current_w.owner_id,
      billing_w.id as billing_workspace_id,
      billing_w.plan_key as plan_key
    from workspaces current_w
    join workspace_members current_m
      on current_m.workspace_id = current_w.id
     and current_m.user_id = ${userId}::uuid
    join lateral (
      select w2.id, w2.plan_key, w2.created_at
      from workspaces w2
      left join subscriptions s
        on s.workspace_id = w2.id
       and s.status = 'active'
       and s.current_period_end > now()
      where w2.owner_id = current_w.owner_id
      order by
        case when s.plan_key is not null and s.plan_key <> 'free' then 0 else 1 end,
        case coalesce(s.plan_key, w2.plan_key)
          when 'agency' then 4
          when 'pro' then 3
          when 'starter' then 2
          else 1
        end desc,
        w2.created_at asc
      limit 1
    ) billing_w on true
    where current_w.id = ${currentWorkspaceId}::uuid
    limit 1
  `) as unknown as Array<{
    owner_id: string;
    billing_workspace_id: string;
    plan_key: PlanKey;
  }>;

  return rows[0] ?? null;
}
