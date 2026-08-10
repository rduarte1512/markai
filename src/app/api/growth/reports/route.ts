import { NextResponse } from "next/server";
import { cleanText, enforceFeature, enforceLimit, generateGrowthAi, GrowthError, requireGrowthContext } from "@/lib/growth-server";

function n(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: Request) {
  try {
    const { session, sql, plan } = await requireGrowthContext();
    const rule = enforceFeature(plan, "reports");
    const body = (await request.json()) as Record<string, unknown>;
    const brandId = cleanText(body.brandId, 80);
    const periodStart = cleanText(body.periodStart, 20);
    const periodEnd = cleanText(body.periodEnd, 20);
    if (!brandId || !periodStart || !periodEnd) throw new GrowthError("Seleciona marca e período do relatório.");

    const brandRows = (await sql`
      select id, name, industry from brands
      where id = ${brandId}::uuid and workspace_id = ${session.workspaceId}::uuid and status = 'active' limit 1
    `) as unknown as Array<{ id: string; name: string; industry?: string }>;
    const brand = brandRows[0];
    if (!brand) throw new GrowthError("Marca inválida.", 403);

    const countRows = (await sql`
      select count(*)::int as count from reports r join brands b on b.id = r.brand_id
      where b.workspace_id = ${session.workspaceId}::uuid and r.created_at >= date_trunc('month', now()) and r.status <> 'archived'
    `) as unknown as Array<{ count: number }>;
    enforceLimit(Number(countRows[0]?.count || 0), rule.limit, `Atingiste o limite do plano: ${rule.label}.`);

    const metricRows = (await sql`
      select
        coalesce(sum(cs.spend),0)::numeric as spend,
        coalesce(sum(cs.revenue),0)::numeric as revenue,
        coalesce(sum(cs.impressions),0)::bigint as impressions,
        coalesce(sum(cs.clicks),0)::bigint as clicks,
        coalesce(sum(cs.conversions),0)::numeric as conversions,
        count(distinct cs.campaign_id)::int as campaigns
      from campaign_snapshots cs
      join campaigns c on c.id = cs.campaign_id
      where c.brand_id = ${brandId}::uuid
        and coalesce(cs.period_end, cs.created_at::date) >= ${periodStart}::date
        and coalesce(cs.period_start, cs.created_at::date) <= ${periodEnd}::date
    `) as unknown as Array<Record<string, unknown>>;
    const base = metricRows[0] || {};

    let funnel = { views: 0, purchases: 0, revenue: 0 };
    try {
      const funnelRows = (await sql`
        select
          count(*) filter (where fe.event_type = 'view')::int as views,
          count(*) filter (where fe.event_type = 'purchase')::int as purchases,
          coalesce(sum(fe.value) filter (where fe.event_type = 'purchase'),0)::numeric as revenue
        from funnel_events fe
        join funnels f on f.id = fe.funnel_id
        where f.brand_id = ${brandId}::uuid and fe.created_at::date between ${periodStart}::date and ${periodEnd}::date
      `) as unknown as Array<Record<string, unknown>>;
      funnel = { views: n(funnelRows[0]?.views), purchases: n(funnelRows[0]?.purchases), revenue: n(funnelRows[0]?.revenue) };
    } catch {
      // Migration may not be applied yet; the report still works with campaign data.
    }

    const spend = n(base.spend);
    const revenue = n(base.revenue);
    const impressions = n(base.impressions);
    const clicks = n(base.clicks);
    const conversions = n(base.conversions);
    const metrics = {
      spend,
      revenue,
      impressions,
      clicks,
      conversions,
      campaigns: n(base.campaigns),
      roas: spend > 0 ? revenue / spend : 0,
      ctr: impressions > 0 ? clicks / impressions * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpa: conversions > 0 ? spend / conversions : 0,
      funnel,
    };

    let insights = [
      `Spend: €${spend.toFixed(2)} · Revenue: €${revenue.toFixed(2)} · ROAS: ${metrics.roas.toFixed(2)}x.`,
      conversions > 0 ? `Foram acompanhadas ${conversions.toFixed(0)} conversões, com CPA médio de €${metrics.cpa.toFixed(2)}.` : "Ainda não existem conversões suficientes para calcular CPA.",
      funnel.views > 0 ? `O funil registou ${funnel.views} visitas e ${funnel.purchases} compras no período.` : "Sem eventos de funil suficientes neste período.",
    ].join("\n");

    if (rule.ai) {
      const generated = await generateGrowthAi({
        workspaceId: session.workspaceId,
        userId: session.userId,
        brandId,
        operation: "growth_report",
        system: "És o analista de performance do MarkAI. Responde em português de Portugal. Produz um resumo executivo curto, identifica 3 sinais relevantes e recomenda 3 ações específicas. Não inventes métricas que não estejam nos dados.",
        user: `Marca: ${brand.name}. Setor: ${brand.industry || "não definido"}. Período: ${periodStart} a ${periodEnd}. Métricas: ${JSON.stringify(metrics)}.`,
      });
      insights = generated.text;
    }

    const title = cleanText(body.title, 180) || `Relatório ${brand.name} · ${periodStart} — ${periodEnd}`;
    const rows = await sql`
      insert into reports(brand_id, created_by, title, period_start, period_end, metrics, ai_insights, status)
      values (${brandId}::uuid, ${session.userId}::uuid, ${title}, ${periodStart}::date, ${periodEnd}::date, ${JSON.stringify(metrics)}::jsonb, ${insights}, 'ready')
      returning id, title, status, created_at
    `;
    return NextResponse.json({ ok: true, report: rows[0], message: rule.ai ? "Relatório com insights de IA criado." : "Relatório essencial criado." });
  } catch (cause) {
    const status = cause instanceof GrowthError ? cause.status : 500;
    if (!(cause instanceof GrowthError)) console.error("Growth Reports API failed:", cause);
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Não foi possível gerar o relatório." }, { status });
  }
}
