import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";

const TYPES = ["post", "reel", "story", "article", "email", "seo_brief", "other"];
const STATUSES = ["idea", "draft", "review", "approved", "scheduled", "published", "archived"];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      brandId?: string;
      title?: string;
      contentType?: string;
      channel?: string;
      body?: string;
      scheduledFor?: string;
    };
    const brandId = body.brandId?.trim();
    const title = body.title?.trim();
    const contentType = TYPES.includes(body.contentType || "") ? body.contentType! : "post";
    if (!brandId || !title) return NextResponse.json({ error: "Preenche a marca e o título." }, { status: 400 });

    const sql = getSql();
    const access = (await sql`
      select id, name from brands
      where id = ${brandId}
        and workspace_id = ${session.workspaceId}
        and status = 'active'
      limit 1
    `) as unknown as Array<{ id: string; name: string }>;
    if (!access[0]) return NextResponse.json({ error: "Marca inválida para este workspace." }, { status: 403 });

    const scheduled = body.scheduledFor ? new Date(body.scheduledFor) : null;
    const status = scheduled && !Number.isNaN(scheduled.getTime()) ? "scheduled" : "idea";
    const created = (await sql`
      insert into content_items (
        brand_id, created_by, title, content_type, channel, body,
        status, scheduled_for, metadata
      ) values (
        ${brandId}, ${session.userId}, ${title}, ${contentType},
        ${body.channel?.trim() || null}, ${body.body?.trim() || null},
        ${status}, ${scheduled && !Number.isNaN(scheduled.getTime()) ? scheduled.toISOString() : null},
        ${JSON.stringify({ source: "content_studio_v2" })}::jsonb
      )
      returning id, brand_id, title, content_type, channel, body, status, scheduled_for, created_at
    `) as unknown as Array<Record<string, unknown>>;

    return NextResponse.json({ item: { ...created[0], brand_name: access[0].name } });
  } catch (cause) {
    console.error("Create content error:", cause);
    return NextResponse.json({ error: "Não foi possível criar o conteúdo." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const body = (await request.json()) as { itemId?: string; status?: string };
    if (!body.itemId || !STATUSES.includes(body.status || "")) {
      return NextResponse.json({ error: "Alteração inválida." }, { status: 400 });
    }
    const sql = getSql();
    const updated = (await sql`
      update content_items ci
      set status = ${body.status}, updated_at = now()
      from brands b
      where ci.id = ${body.itemId}
        and b.id = ci.brand_id
        and b.workspace_id = ${session.workspaceId}
      returning ci.id, ci.status
    `) as unknown as Array<{ id: string; status: string }>;
    if (!updated[0]) return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true, ...updated[0] });
  } catch (cause) {
    console.error("Update content error:", cause);
    return NextResponse.json({ error: "Não foi possível atualizar o conteúdo." }, { status: 500 });
  }
}
