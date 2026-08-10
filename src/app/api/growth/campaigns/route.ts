import { NextResponse } from "next/server";
import { cleanText, enforceFeature, enforceLimit, GrowthError, parsePositive, requireGrowthContext } from "@/lib/growth-server";

export async function POST(request: Request) {
  try {
    const { session, sql, plan } = await requireGrowthContext();
    const rule = enforceFeature(plan, "campaigns");
    const body = (await request.json()) as Record<string, unknown>;
    const action = cleanText(body.action, 30) || "create";

    if (action === "archive") {
      const campaignId = cleanText(body.campaignId, 80);
      const rows = await sql`
        update campaigns c set status = 'archived', updated_at = now()
        from brands b
        where c.id = ${campaignId}::uuid and b.id = c.brand_id and b.workspace_id = ${session.workspaceId}::uuid
        returning c.id
      `;
      if (!rows[0]) throw new GrowthError("Campanha não encontrada.", 404);
      return NextResponse.json({ ok: true, message: "Campanha arquivada." });
    }

    const brandId = cleanText(body.brandId, 80);
    const name = cleanText(body.name, 140);
    if (!brandId || !name) throw new GrowthError("Seleciona a marca e dá um nome à campanha.");

    const brand = await sql`
      select id from brands where id = ${brandId}::uuid and workspace_id = ${session.workspaceId}::uuid and status = 'active' limit 1
    `;
    if (!brand[0]) throw new GrowthError("Marca inválida para este workspace.", 403);

    const countRows = (await sql`
      select count(*)::int as count
      from campaigns c join brands b on b.id = c.brand_id
      where b.workspace_id = ${session.workspaceId}::uuid and c.status in ('draft','active','paused')
    `) as unknown as Array<{ count: number }>;
    enforceLimit(Number(countRows[0]?.count || 0), rule.limit, `O plano atual permite ${rule.label}. Faz upgrade para criar mais campanhas.`);

    const objective = cleanText(body.objective, 80) || null;
    const channel = cleanText(body.channel, 80) || null;
    const budget = parsePositive(body.budget, 0);
    const startDate = cleanText(body.startDate, 20) || null;
    const endDate = cleanText(body.endDate, 20) || null;
    const strategyText = cleanText(body.strategy, 5000);

    const rows = await sql`
      insert into campaigns(brand_id, created_by, name, objective, channel, status, budget, start_date, end_date, strategy)
      values (
        ${brandId}::uuid, ${session.userId}::uuid, ${name}, ${objective}, ${channel}, 'draft',
        ${budget || null}, ${startDate}, ${endDate},
        ${JSON.stringify({ brief: strategyText, source: "growth_os" })}::jsonb
      )
      returning id, name, status
    `;
    return NextResponse.json({ ok: true, campaign: rows[0], message: "Campanha criada no Campaign OS." });
  } catch (cause) {
    const status = cause instanceof GrowthError ? cause.status : 500;
    if (!(cause instanceof GrowthError)) console.error("Campaign OS API failed:", cause);
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Não foi possível guardar a campanha." }, { status });
  }
}
