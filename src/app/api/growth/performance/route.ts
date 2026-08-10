import { NextResponse } from "next/server";
import { decryptSecret } from "@/lib/secret-box";
import { cleanText, enforceFeature, enforceLimit, GrowthError, parsePositive, requireGrowthContext } from "@/lib/growth-server";

function providerKey(value: string) {
  if (value === "google") return "google_ads";
  return value;
}

async function saveSnapshot(sql: Awaited<ReturnType<typeof requireGrowthContext>>["sql"], session: { workspaceId: string; userId: string }, body: Record<string, unknown>) {
  const campaignId = cleanText(body.campaignId, 80);
  if (!campaignId) throw new GrowthError("Seleciona uma campanha.");
  const campaign = await sql`
    select c.id from campaigns c join brands b on b.id = c.brand_id
    where c.id = ${campaignId}::uuid and b.workspace_id = ${session.workspaceId}::uuid and c.status <> 'archived' limit 1
  `;
  if (!campaign[0]) throw new GrowthError("Campanha inválida.", 403);

  const spend = parsePositive(body.spend);
  const impressions = Math.round(parsePositive(body.impressions));
  const clicks = Math.round(parsePositive(body.clicks));
  const conversions = parsePositive(body.conversions);
  const revenue = parsePositive(body.revenue);
  const ctr = impressions > 0 ? clicks / impressions * 100 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const roas = spend > 0 ? revenue / spend : 0;
  const provider = providerKey(cleanText(body.provider, 40) || "manual");
  const today = new Date().toISOString().slice(0, 10);

  const rows = await sql`
    insert into campaign_snapshots(
      campaign_id, captured_by, provider, period_start, period_end,
      spend, impressions, clicks, conversions, revenue, metrics
    ) values (
      ${campaignId}::uuid, ${session.userId}::uuid, ${provider}, ${cleanText(body.periodStart, 20) || today},
      ${cleanText(body.periodEnd, 20) || today}, ${spend}, ${impressions}, ${clicks}, ${conversions}, ${revenue},
      ${JSON.stringify({ ctr, cpc, cpa, roas, source: "growth_os" })}::jsonb
    ) returning id, campaign_id, provider, created_at
  `;
  return rows[0];
}

export async function POST(request: Request) {
  try {
    const context = await requireGrowthContext();
    const { session, sql, plan } = context;
    const rule = enforceFeature(plan, "performance");
    const body = (await request.json()) as Record<string, unknown>;
    const action = cleanText(body.action, 30) || "snapshot";

    const countRows = (await sql`
      select count(*)::int as count
      from campaign_snapshots cs
      join campaigns c on c.id = cs.campaign_id
      join brands b on b.id = c.brand_id
      where b.workspace_id = ${session.workspaceId}::uuid and cs.created_at >= date_trunc('month', now())
    `) as unknown as Array<{ count: number }>;
    enforceLimit(Number(countRows[0]?.count || 0), rule.limit, `Atingiste o limite do plano: ${rule.label}.`);

    if (action !== "sync") {
      const snapshot = await saveSnapshot(sql, session, body);
      return NextResponse.json({ ok: true, snapshot, message: "Snapshot de performance guardado." });
    }

    if (!rule.live) throw new GrowthError("A sincronização automática de performance requer um plano pago.", 403);
    const provider = providerKey(cleanText(body.provider, 40));
    const campaignId = cleanText(body.campaignId, 80);
    if (!provider || !campaignId) throw new GrowthError("Seleciona campanha e plataforma para sincronizar.");
    const webhook = process.env.PERFORMANCE_SYNC_WEBHOOK_URL;
    if (!webhook) throw new GrowthError("Define PERFORMANCE_SYNC_WEBHOOK_URL para ativar a sincronização da plataforma.", 503);

    const integrationRows = (await sql`
      select credentials_enc, account_label, metadata from ad_integrations
      where workspace_id = ${session.workspaceId}::uuid and provider = ${provider} limit 1
    `) as unknown as Array<{ credentials_enc: string; account_label?: string; metadata?: Record<string, unknown> }>;
    if (!integrationRows[0]) throw new GrowthError("Liga primeiro esta plataforma em Definições > Integrações.", 409);

    const credentials = JSON.parse(decryptSecret(integrationRows[0].credentials_enc)) as Record<string, unknown>;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.PERFORMANCE_SYNC_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.PERFORMANCE_SYNC_WEBHOOK_SECRET}` } : {}),
        },
        body: JSON.stringify({ provider, campaignId, workspaceId: session.workspaceId, account: integrationRows[0].account_label, metadata: integrationRows[0].metadata, credentials }),
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) throw new GrowthError(`O conector devolveu ${response.status}.`, 502);
      const payload = await response.json() as { snapshots?: Array<Record<string, unknown>> };
      if (!payload.snapshots?.length) throw new GrowthError("O conector não devolveu métricas para esta campanha.", 502);
      let saved = 0;
      for (const snapshot of payload.snapshots.slice(0, Math.max(1, rule.limit - Number(countRows[0]?.count || 0)))) {
        await saveSnapshot(sql, session, { ...snapshot, campaignId, provider });
        saved += 1;
      }
      return NextResponse.json({ ok: true, message: `${saved} snapshots sincronizados de ${provider}.` });
    } finally {
      clearTimeout(timeout);
    }
  } catch (cause) {
    const status = cause instanceof GrowthError ? cause.status : 500;
    if (!(cause instanceof GrowthError)) console.error("Performance Intelligence API failed:", cause);
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Não foi possível guardar a performance." }, { status });
  }
}
