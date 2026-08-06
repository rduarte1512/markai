import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { slugify } from "@/lib/format";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    if (name.length < 2 || description.length < 10) {
      return NextResponse.json({ error: "Indica um nome e uma descrição mais completa." }, { status: 400 });
    }

    const sql = getSql();
    const access = (await sql`
      select pc.brand_limit,
        (select count(*)::int from brands where workspace_id = ${session.workspaceId} and status = 'active') as brand_count
      from workspaces w join plan_catalog pc on pc.key = w.plan_key
      where w.id = ${session.workspaceId}
    `) as unknown as Array<{ brand_limit: number; brand_count: number }>;

    if (!access[0] || Number(access[0].brand_count) >= Number(access[0].brand_limit)) {
      return NextResponse.json({ error: "Atingiste o limite de marcas do teu plano." }, { status: 403 });
    }

    const baseSlug = slugify(name) || "marca";
    const suffix = Math.random().toString(36).slice(2, 7);
    const values = String(body.values || "").split(",").map((item) => item.trim()).filter(Boolean);

    const rows = (await sql`
      insert into brands (
        workspace_id, name, slug, industry, website, description, audience,
        tone_of_voice, primary_color, secondary_color, values, onboarding_completed
      ) values (
        ${session.workspaceId}, ${name}, ${`${baseSlug}-${suffix}`},
        ${String(body.industry || "").trim() || null},
        ${String(body.website || "").trim() || null},
        ${description},
        ${String(body.audience || "").trim() || null},
        ${String(body.toneOfVoice || "").trim() || null},
        ${String(body.primaryColor || "#8B5CF6")},
        ${String(body.secondaryColor || "#22D3EE")},
        ${JSON.stringify(values)}::jsonb,
        ${Boolean(String(body.audience || "").trim() && String(body.toneOfVoice || "").trim())}
      ) returning id
    `) as unknown as Array<{ id: string }>;

    return NextResponse.json({ brandId: rows[0]?.id }, { status: 201 });
  } catch (cause) {
    console.error("Create brand error:", cause);
    return NextResponse.json({ error: "Não foi possível criar a marca." }, { status: 500 });
  }
}
