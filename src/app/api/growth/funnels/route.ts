import { NextResponse } from "next/server";
import { cleanText, enforceFeature, GrowthError, parsePositive, requireGrowthContext } from "@/lib/growth-server";

export async function POST(request: Request) {
  try {
    const { session, sql, plan } = await requireGrowthContext();
    enforceFeature(plan, "funnelAnalytics");
    const body = (await request.json()) as Record<string, unknown>;
    const funnelId = cleanText(body.funnelId, 80);
    const action = cleanText(body.action, 30) || "experiment";
    if (!funnelId) throw new GrowthError("Seleciona um funil.");

    const funnelRows = (await sql`
      select f.id, f.settings from funnels f join brands b on b.id = f.brand_id
      where f.id = ${funnelId}::uuid and b.workspace_id = ${session.workspaceId}::uuid and f.status <> 'archived' limit 1
    `) as unknown as Array<{ id: string; settings?: Record<string, unknown> }>;
    if (!funnelRows[0]) throw new GrowthError("Funil inválido.", 403);

    if (action === "experiment") {
      const experimentName = cleanText(body.experimentName, 120);
      const variantB = cleanText(body.variantB, 120);
      const trafficB = Math.min(90, Math.max(10, Math.round(parsePositive(body.trafficB, 50))));
      if (!experimentName || !variantB) throw new GrowthError("Define o nome do teste e a variante B.");
      const patch = {
        ab_test: {
          active: true,
          name: experimentName,
          variant_a: "Control",
          variant_b: variantB,
          traffic_b: trafficB,
          started_at: new Date().toISOString(),
        },
      };
      await sql`update funnels set settings = coalesce(settings, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb, updated_at = now() where id = ${funnelId}::uuid`;
      return NextResponse.json({ ok: true, message: `Teste A/B ativado com ${trafficB}% de tráfego na variante B.` });
    }

    if (action === "stop_experiment") {
      const current = funnelRows[0].settings || {};
      const ab = (current.ab_test || {}) as Record<string, unknown>;
      const patch = { ab_test: { ...ab, active: false, stopped_at: new Date().toISOString() } };
      await sql`update funnels set settings = coalesce(settings, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb, updated_at = now() where id = ${funnelId}::uuid`;
      return NextResponse.json({ ok: true, message: "Teste A/B terminado." });
    }

    throw new GrowthError("Ação de funil inválida.");
  } catch (cause) {
    const status = cause instanceof GrowthError ? cause.status : 500;
    if (!(cause instanceof GrowthError)) console.error("Funnel Analytics API failed:", cause);
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Não foi possível atualizar o funil." }, { status });
  }
}
