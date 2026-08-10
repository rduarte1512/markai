import { NextResponse } from "next/server";
import { runAutomationRules } from "@/lib/automation-engine";
import { cleanText, enforceFeature, enforceLimit, GrowthError, parsePositive, requireGrowthContext } from "@/lib/growth-server";

const triggers = ["daily_summary", "cpa_threshold", "content_approved", "funnel_dropoff"] as const;
const actions = ["create_report", "create_content_idea", "create_decision", "clone_winning_ad"] as const;

export async function POST(request: Request) {
  try {
    const { session, sql, plan } = await requireGrowthContext();
    const ruleAccess = enforceFeature(plan, "automations");
    const body = (await request.json()) as Record<string, unknown>;
    const action = cleanText(body.action, 30) || "create";

    if (action === "run") {
      const ruleId = cleanText(body.ruleId, 80);
      if (!ruleId) throw new GrowthError("Seleciona uma automação.");
      const rows = await sql`select id from automation_rules where id = ${ruleId}::uuid and workspace_id = ${session.workspaceId}::uuid limit 1`;
      if (!rows[0]) throw new GrowthError("Automação não encontrada.", 404);
      const results = await runAutomationRules(session.workspaceId, ruleId, true);
      const result = results[0];
      return NextResponse.json({ ok: true, result, message: result?.action || result?.reason || "Automação executada." });
    }

    const countRows = (await sql`
      select count(*)::int as count from automation_rules where workspace_id = ${session.workspaceId}::uuid and enabled = true
    `) as unknown as Array<{ count: number }>;
    enforceLimit(Number(countRows[0]?.count || 0), ruleAccess.limit, `Atingiste o limite do plano: ${ruleAccess.label}.`);

    const name = cleanText(body.name, 160);
    const brandId = cleanText(body.brandId, 80) || null;
    const triggerKey = cleanText(body.triggerKey, 40) as (typeof triggers)[number];
    const actionKey = cleanText(body.actionKey, 40) as (typeof actions)[number];
    const threshold = parsePositive(body.threshold, triggerKey === "funnel_dropoff" ? 60 : 20);
    if (!name || !triggers.includes(triggerKey) || !actions.includes(actionKey)) throw new GrowthError("Configuração de automação inválida.");

    if (brandId) {
      const brand = await sql`select id from brands where id = ${brandId}::uuid and workspace_id = ${session.workspaceId}::uuid and status = 'active' limit 1`;
      if (!brand[0]) throw new GrowthError("Marca inválida.", 403);
    }

    const rows = await sql`
      insert into automation_rules(workspace_id, brand_id, created_by, name, trigger_key, trigger_config, action_key, action_config, enabled)
      values (
        ${session.workspaceId}::uuid, ${brandId}::uuid, ${session.userId}::uuid, ${name}, ${triggerKey},
        ${JSON.stringify({ threshold })}::jsonb, ${actionKey}, '{}'::jsonb, true
      ) returning id, name, enabled
    `;
    return NextResponse.json({ ok: true, automation: rows[0], message: "Automação criada e ativada." });
  } catch (cause) {
    const status = cause instanceof GrowthError ? cause.status : 500;
    if (!(cause instanceof GrowthError)) console.error("Automations API failed:", cause);
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Não foi possível guardar a automação." }, { status });
  }
}
