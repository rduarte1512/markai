import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTITY_TYPES = ["ad", "content", "funnel", "campaign", "report"] as const;

async function portalBrand(token: string) {
  const sql = getSql();
  const rows = (await sql`
    select cpl.brand_id, b.workspace_id
    from client_portal_links cpl join brands b on b.id = cpl.brand_id
    where cpl.token = ${token} and cpl.active = true
      and (cpl.expires_at is null or cpl.expires_at > now())
    limit 1
  `) as unknown as Array<{ brand_id: string; workspace_id: string }>;
  return rows[0] || null;
}

async function entityBelongsToBrand(entityType: string, entityId: string, brandId: string) {
  const sql = getSql();
  if (entityType === "ad") return Boolean((await sql`select id from ads where id = ${entityId}::uuid and brand_id = ${brandId}::uuid limit 1`)[0]);
  if (entityType === "content") return Boolean((await sql`select id from content_items where id = ${entityId}::uuid and brand_id = ${brandId}::uuid limit 1`)[0]);
  if (entityType === "funnel") return Boolean((await sql`select id from funnels where id = ${entityId}::uuid and brand_id = ${brandId}::uuid limit 1`)[0]);
  if (entityType === "campaign") return Boolean((await sql`select id from campaigns where id = ${entityId}::uuid and brand_id = ${brandId}::uuid limit 1`)[0]);
  if (entityType === "report") return Boolean((await sql`select id from reports where id = ${entityId}::uuid and brand_id = ${brandId}::uuid limit 1`)[0]);
  return false;
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!token || token.length < 24) return NextResponse.json({ error: "Portal inválido." }, { status: 404 });
    const access = await portalBrand(token);
    if (!access) return NextResponse.json({ error: "Este portal expirou ou foi desativado." }, { status: 404 });

    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "approval");
    const entityType = String(body.entityType || "") as (typeof ENTITY_TYPES)[number];
    const entityId = String(body.entityId || "");
    if (!ENTITY_TYPES.includes(entityType) || !UUID_RE.test(entityId)) return NextResponse.json({ error: "Item inválido." }, { status: 400 });
    if (!(await entityBelongsToBrand(entityType, entityId, access.brand_id))) return NextResponse.json({ error: "Este item não pertence ao portal." }, { status: 403 });

    const sql = getSql();
    const clientName = String(body.clientName || "").trim().slice(0, 120) || null;
    const note = String(body.note || "").trim().slice(0, 4000);

    if (action === "comment") {
      if (!note) return NextResponse.json({ error: "Escreve um comentário." }, { status: 400 });
      await sql`
        insert into team_comments(workspace_id, brand_id, user_id, entity_type, entity_id, body, resolved)
        values (${access.workspace_id}::uuid, ${access.brand_id}::uuid, null, ${entityType}, ${entityId}::uuid, ${clientName ? `${clientName}: ${note}` : note}, false)
      `;
      return NextResponse.json({ ok: true, message: "Comentário enviado à agência." });
    }

    const status = String(body.status || "");
    if (!['approved','changes_requested'].includes(status)) return NextResponse.json({ error: "Decisão inválida." }, { status: 400 });
    const rows = (await sql`
      insert into client_approvals(brand_id, entity_type, entity_id, status, client_name, client_note, decided_at)
      values (${access.brand_id}::uuid, ${entityType}, ${entityId}::uuid, ${status}, ${clientName}, ${note || null}, now())
      on conflict (brand_id, entity_type, entity_id) do update set
        status = excluded.status, client_name = excluded.client_name, client_note = excluded.client_note,
        decided_at = now(), updated_at = now()
      returning entity_type, entity_id, status, client_name, client_note, decided_at
    `) as unknown as Array<{ entity_type: string; entity_id: string; status: string; client_name?: string; client_note?: string; decided_at: string }>;

    if (entityType === "ad") {
      await sql`update ads set status = ${status === "approved" ? "approved" : "rejected"}, updated_at = now() where id = ${entityId}::uuid`;
    } else if (entityType === "content") {
      await sql`update content_items set status = ${status === "approved" ? "approved" : "review"}, updated_at = now() where id = ${entityId}::uuid`;
    } else if (entityType === "report" && status === "approved") {
      await sql`update reports set status = 'shared', updated_at = now() where id = ${entityId}::uuid`;
    }

    if (note) {
      await sql`
        insert into team_comments(workspace_id, brand_id, user_id, entity_type, entity_id, body, resolved)
        values (${access.workspace_id}::uuid, ${access.brand_id}::uuid, null, ${entityType}, ${entityId}::uuid, ${clientName ? `${clientName}: ${note}` : note}, false)
      `;
    }

    return NextResponse.json({ ok: true, approval: rows[0], message: status === "approved" ? "Aprovado e registado no MarkAI." : "Pedido de alterações enviado à agência." });
  } catch (cause) {
    console.error("Client portal action failed:", cause);
    return NextResponse.json({ error: "Não foi possível guardar a decisão." }, { status: 500 });
  }
}
