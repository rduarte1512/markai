import { NextResponse } from "next/server";
import { cleanText, enforceFeature, enforceLimit, GrowthError, requireGrowthContext } from "@/lib/growth-server";

function expiry(value: unknown) {
  const text = cleanText(value, 30);
  if (!text) return null;
  const parsed = new Date(`${text}T23:59:59.999Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function POST(request: Request) {
  try {
    const { session, sql, plan } = await requireGrowthContext();
    const rule = enforceFeature(plan, "clientPortal");
    const body = (await request.json()) as Record<string, unknown>;
    const brandId = cleanText(body.brandId, 80);
    if (!brandId) throw new GrowthError("Seleciona uma marca.");

    const brand = await sql`select id from brands where id = ${brandId}::uuid and workspace_id = ${session.workspaceId}::uuid and status = 'active' limit 1`;
    if (!brand[0]) throw new GrowthError("Marca inválida para este workspace.", 403);

    const countRows = (await sql`
      select count(*)::int as count from client_portal_links cpl
      join brands b on b.id = cpl.brand_id
      where b.workspace_id = ${session.workspaceId}::uuid and cpl.active = true
    `) as unknown as Array<{ count: number }>;
    enforceLimit(Number(countRows[0]?.count || 0), rule.limit, `Atingiste o limite do plano: ${rule.label}.`);

    const label = cleanText(body.label, 160) || null;
    const expiresAt = expiry(body.expiresAt);
    const rows = await sql`
      insert into client_portal_links(brand_id, label, expires_at, active, created_by)
      values (${brandId}::uuid, ${label}, ${expiresAt}, true, ${session.userId}::uuid)
      returning id, token, label, expires_at, active, created_at
    `;
    return NextResponse.json({ ok: true, portal: rows[0], message: "Portal de cliente criado." });
  } catch (cause) {
    const status = cause instanceof GrowthError ? cause.status : 500;
    if (!(cause instanceof GrowthError)) console.error("Client Portal management API failed:", cause);
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Não foi possível criar o portal." }, { status });
  }
}
