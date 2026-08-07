import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSession,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";
import { getSql } from "@/lib/db";
import { getBillingWorkspaceForUser, getWorkspaceLimit } from "@/lib/workspaces";

export const runtime = "nodejs";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "workspace";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const body = (await request.json().catch(() => null)) as { name?: string } | null;
    const name = String(body?.name || "").trim();
    if (name.length < 2 || name.length > 70) {
      return NextResponse.json({ error: "O nome do workspace deve ter entre 2 e 70 caracteres." }, { status: 400 });
    }

    const billing = await getBillingWorkspaceForUser(session.userId, session.workspaceId);
    if (!billing) return NextResponse.json({ error: "Workspace atual inválido." }, { status: 404 });
    if (billing.owner_id !== session.userId) {
      return NextResponse.json({ error: "Só o proprietário da conta pode criar workspaces adicionais." }, { status: 403 });
    }

    const limit = getWorkspaceLimit(billing.plan_key);
    if (billing.plan_key === "free" || limit <= 1) {
      return NextResponse.json(
        { error: "Os workspaces adicionais estão disponíveis a partir do plano Starter.", upgrade: true },
        { status: 403 },
      );
    }

    const sql = getSql();
    const counts = (await sql`
      select count(*)::int as count
      from workspaces
      where owner_id = ${session.userId}::uuid
    `) as unknown as Array<{ count: number }>;
    const currentCount = Number(counts[0]?.count || 0);

    if (currentCount >= limit) {
      return NextResponse.json(
        { error: `O teu plano permite até ${limit} workspaces. Faz upgrade para criar mais.`, limitReached: true },
        { status: 403 },
      );
    }

    const slug = `${slugify(name).slice(0, 42)}-${randomUUID().slice(0, 6)}`;
    const rows = (await sql`
      with created as (
        insert into workspaces(owner_id, name, slug, plan_key)
        values (${session.userId}::uuid, ${name}, ${slug}, ${billing.plan_key})
        returning id, name, slug
      ), membership as (
        insert into workspace_members(workspace_id, user_id, role)
        select id, ${session.userId}::uuid, 'owner' from created
        returning workspace_id
      )
      select id, name, slug from created
    `) as unknown as Array<{ id: string; name: string; slug: string }>;

    const workspace = rows[0];
    if (!workspace) throw new Error("WORKSPACE_CREATE_FAILED");

    const token = await createSessionToken(session.userId, workspace.id);
    const response = NextResponse.json({
      ok: true,
      workspace,
      count: currentCount + 1,
      limit,
      next: "/onboarding",
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (cause) {
    console.error("Workspace creation error:", cause);
    return NextResponse.json({ error: "Não foi possível criar o workspace." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const body = (await request.json().catch(() => null)) as { name?: string; slug?: string } | null;
    const name = String(body?.name || "").trim();
    const requestedSlug = String(body?.slug || "").trim();
    const slug = slugify(requestedSlug);

    if (name.length < 2 || name.length > 70) {
      return NextResponse.json({ error: "O nome do workspace deve ter entre 2 e 70 caracteres." }, { status: 400 });
    }
    if (requestedSlug.length < 2 || slug.length < 2) {
      return NextResponse.json({ error: "A URL do workspace deve ter pelo menos 2 caracteres." }, { status: 400 });
    }

    const sql = getSql();
    const access = (await sql`
      select w.id, w.owner_id
      from workspaces w
      join workspace_members wm on wm.workspace_id = w.id
      where w.id = ${session.workspaceId}::uuid
        and wm.user_id = ${session.userId}::uuid
      limit 1
    `) as unknown as Array<{ id: string; owner_id: string }>;

    if (!access[0]) return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });
    if (access[0].owner_id !== session.userId) {
      return NextResponse.json({ error: "Só o proprietário pode editar as informações do workspace." }, { status: 403 });
    }

    const duplicate = await sql`
      select 1
      from workspaces
      where slug = ${slug}
        and id <> ${session.workspaceId}::uuid
      limit 1
    `;
    if (duplicate.length) {
      return NextResponse.json({ error: "Esta URL já está a ser usada por outro workspace." }, { status: 409 });
    }

    const rows = (await sql`
      update workspaces
      set name = ${name}, slug = ${slug}, updated_at = now()
      where id = ${session.workspaceId}::uuid
        and owner_id = ${session.userId}::uuid
      returning id, name, slug, updated_at
    `) as unknown as Array<{ id: string; name: string; slug: string; updated_at: string }>;

    if (!rows[0]) return NextResponse.json({ error: "Não foi possível atualizar o workspace." }, { status: 403 });
    return NextResponse.json({ ok: true, workspace: rows[0] });
  } catch (cause) {
    console.error("Workspace update error:", cause);
    return NextResponse.json({ error: "Não foi possível guardar as alterações do workspace." }, { status: 500 });
  }
}
