import { notFound } from "next/navigation";
import { ClientPortal } from "@/components/client-portal";
import { getSql } from "@/lib/db";
import { getGrowthAccess } from "@/lib/feature-access";
import type { PlanKey } from "@/lib/types";

export const metadata = { title: "Portal do Cliente · MarkAI" };

export default async function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sql = getSql();
  const links = (await sql`
    select cpl.id, cpl.brand_id, cpl.label, cpl.expires_at, cpl.active,
           b.name as brand_name, b.industry, b.primary_color, b.secondary_color,
           w.name as workspace_name, w.plan_key
    from client_portal_links cpl
    join brands b on b.id = cpl.brand_id
    join workspaces w on w.id = b.workspace_id
    where cpl.token = ${token} and cpl.active = true
      and (cpl.expires_at is null or cpl.expires_at > now())
    limit 1
  `) as unknown as Array<{ id: string; brand_id: string; label?: string; brand_name: string; industry?: string; primary_color?: string; secondary_color?: string; workspace_name: string; plan_key: PlanKey }>;
  const link = links[0];
  if (!link || !getGrowthAccess(link.plan_key).clientPortal.enabled) notFound();

  let approvals: unknown[] = [];
  try {
    approvals = await sql`select entity_type, entity_id, status, client_name, client_note, decided_at from client_approvals where brand_id = ${link.brand_id}::uuid`;
  } catch {
    approvals = [];
  }

  const [campaigns, ads, content, reports, comments] = await Promise.all([
    sql`
      select id, name, objective, channel, status, budget, start_date, end_date, updated_at
      from campaigns where brand_id = ${link.brand_id}::uuid and status <> 'archived'
      order by updated_at desc limit 30
    `,
    sql`
      select id, campaign_id, platform, title, primary_text, description, cta, creative_url, variant_label, status, performance, updated_at
      from ads where brand_id = ${link.brand_id}::uuid and status <> 'archived'
      order by updated_at desc limit 60
    `,
    sql`
      select id, title, content_type, channel, body, status, scheduled_for, updated_at
      from content_items where brand_id = ${link.brand_id}::uuid and status <> 'archived'
      order by updated_at desc limit 60
    `,
    sql`
      select id, title, period_start, period_end, metrics, ai_insights, status, created_at
      from reports where brand_id = ${link.brand_id}::uuid and status in ('ready','shared')
      order by created_at desc limit 30
    `,
    sql`
      select id, entity_type, entity_id, body, resolved, created_at
      from team_comments where brand_id = ${link.brand_id}::uuid
      order by created_at desc limit 120
    `,
  ]);

  return <ClientPortal token={token} portal={link} data={{ campaigns, ads, content, reports, approvals, comments } as never} />;
}
