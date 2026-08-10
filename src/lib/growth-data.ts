import { getSql } from "@/lib/db";

async function optionalQuery<T>(label: string, query: () => Promise<unknown>, fallback: T): Promise<T> {
  try {
    return (await query()) as T;
  } catch (cause) {
    console.warn(`Growth OS optional query failed (${label}). Run database/marketing-os-growth-suite.sql if this is a fresh deployment.`, cause);
    return fallback;
  }
}

export async function getGrowthDashboardData(workspaceId: string, performanceWindowDays = 730, funnelLimit = 999999) {
  const sql = getSql();
  const performanceSince = new Date(Date.now() - Math.max(1, performanceWindowDays) * 24 * 60 * 60 * 1000).toISOString();
  const safeFunnelLimit = Math.max(1, Math.min(999999, Math.round(funnelLimit)));

  const [brands, campaigns, snapshots, publications, portalLinks, reports, funnels, funnelEvents, automations, audits, content, integrations, approvals] = await Promise.all([
    sql`
      select id, name, industry, website, primary_color, secondary_color
      from brands
      where workspace_id = ${workspaceId}::uuid and status = 'active'
      order by name
    `,
    sql`
      select c.id, c.brand_id, b.name as brand_name, c.name, c.objective, c.channel,
             c.status, c.budget, c.start_date, c.end_date, c.strategy, c.created_at, c.updated_at,
             count(a.id)::int as ad_count
      from campaigns c
      join brands b on b.id = c.brand_id
      left join ads a on a.campaign_id = c.id and a.status <> 'archived'
      where b.workspace_id = ${workspaceId}::uuid and c.status <> 'archived'
      group by c.id, b.name
      order by c.updated_at desc
    `,
    optionalQuery("campaign_snapshots", async () => sql`
      select cs.id, cs.campaign_id, cs.provider, cs.period_start, cs.period_end,
             cs.spend, cs.impressions, cs.clicks, cs.conversions, cs.revenue, cs.metrics, cs.created_at
      from campaign_snapshots cs
      join campaigns c on c.id = cs.campaign_id
      join brands b on b.id = c.brand_id
      where b.workspace_id = ${workspaceId}::uuid
        and cs.created_at >= ${performanceSince}::timestamptz
      order by cs.created_at desc
      limit 500
    `, []),
    optionalQuery("social_publications", async () => sql`
      select sp.id, sp.brand_id, b.name as brand_name, sp.content_item_id, ci.title as content_title,
             sp.provider, sp.status, sp.scheduled_for, sp.published_at, sp.external_url,
             sp.payload, sp.error_message, sp.created_at
      from social_publications sp
      join brands b on b.id = sp.brand_id
      left join content_items ci on ci.id = sp.content_item_id
      where sp.workspace_id = ${workspaceId}::uuid
      order by coalesce(sp.scheduled_for, sp.created_at) desc
      limit 160
    `, []),
    sql`
      select cpl.id, cpl.brand_id, b.name as brand_name, cpl.token, cpl.label, cpl.expires_at, cpl.active, cpl.created_at
      from client_portal_links cpl
      join brands b on b.id = cpl.brand_id
      where b.workspace_id = ${workspaceId}::uuid
      order by cpl.created_at desc
    `,
    sql`
      select r.id, r.brand_id, b.name as brand_name, r.title, r.period_start, r.period_end,
             r.metrics, r.ai_insights, r.status, r.created_at
      from reports r
      join brands b on b.id = r.brand_id
      where b.workspace_id = ${workspaceId}::uuid and r.status <> 'archived'
      order by r.created_at desc
      limit 120
    `,
    sql`
      select f.id, f.brand_id, b.name as brand_name, f.name, f.status, f.settings, f.updated_at,
             count(fs.id)::int as step_count
      from funnels f
      join brands b on b.id = f.brand_id
      left join funnel_steps fs on fs.funnel_id = f.id
      where b.workspace_id = ${workspaceId}::uuid and f.status <> 'archived'
      group by f.id, b.name
      order by f.updated_at desc
    `,
    optionalQuery("funnel_events", async () => sql`
      select fe.funnel_id, fe.step_id, fs.title as step_title, fs.position, fe.event_type, fe.variant_key,
             count(*)::int as event_count, coalesce(sum(fe.value), 0)::numeric as total_value
      from funnel_events fe
      join funnels f on f.id = fe.funnel_id
      join brands b on b.id = f.brand_id
      left join funnel_steps fs on fs.id = fe.step_id
      where b.workspace_id = ${workspaceId}::uuid
        and f.id in (
          select f2.id
          from funnels f2
          join brands b2 on b2.id = f2.brand_id
          where b2.workspace_id = ${workspaceId}::uuid and f2.status <> 'archived'
          order by f2.updated_at desc
          limit ${safeFunnelLimit}
        )
      group by fe.funnel_id, fe.step_id, fs.title, fs.position, fe.event_type, fe.variant_key
      order by fe.funnel_id, fs.position nulls last
    `, []),
    optionalQuery("automation_rules", async () => sql`
      select ar.id, ar.brand_id, b.name as brand_name, ar.name, ar.trigger_key, ar.trigger_config,
             ar.action_key, ar.action_config, ar.enabled, ar.last_run_at, ar.last_result, ar.created_at
      from automation_rules ar
      left join brands b on b.id = ar.brand_id
      where ar.workspace_id = ${workspaceId}::uuid
      order by ar.enabled desc, ar.updated_at desc
    `, []),
    optionalQuery("search_audits", async () => sql`
      select sa.id, sa.brand_id, b.name as brand_name, sa.url, sa.keywords, sa.seo_score,
             sa.geo_score, sa.metrics, sa.insights, sa.status, sa.created_at
      from search_audits sa
      join brands b on b.id = sa.brand_id
      where b.workspace_id = ${workspaceId}::uuid
      order by sa.created_at desc
      limit 100
    `, []),
    sql`
      select ci.id, ci.brand_id, b.name as brand_name, ci.title, ci.content_type, ci.channel,
             ci.body, ci.status, ci.scheduled_for, ci.created_at
      from content_items ci
      join brands b on b.id = ci.brand_id
      where b.workspace_id = ${workspaceId}::uuid and ci.status in ('approved','scheduled','published')
      order by ci.created_at desc
      limit 120
    `,
    optionalQuery("ad_integrations", async () => sql`
      select provider, account_label, status, metadata, updated_at
      from ad_integrations
      where workspace_id = ${workspaceId}::uuid
      order by provider
    `, []),
    optionalQuery("client_approvals", async () => sql`
      select ca.id, ca.brand_id, b.name as brand_name, ca.entity_type, ca.entity_id,
             ca.status, ca.client_name, ca.client_note, ca.decided_at, ca.created_at
      from client_approvals ca
      join brands b on b.id = ca.brand_id
      where b.workspace_id = ${workspaceId}::uuid
      order by ca.created_at desc
      limit 160
    `, []),
  ]);

  return {
    brands,
    campaigns,
    snapshots,
    publications,
    portalLinks,
    reports,
    funnels,
    funnelEvents,
    automations,
    audits,
    content,
    integrations,
    approvals,
  };
}
