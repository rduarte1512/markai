import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSession,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";
import { getSql } from "@/lib/db";
import { getBillingWorkspaceForWorkspace, getWorkspaceLimit } from "@/lib/workspaces";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { workspaceId?: string } | null;
  const workspaceId = body?.workspaceId?.trim();
  if (!workspaceId) return NextResponse.json({ error: "Workspace inválido" }, { status: 400 });

  const sql = getSql();
  const memberships = (await sql`
    select w.id, w.name, w.owner_id, wm.role
    from workspace_members wm
    join workspaces w on w.id = wm.workspace_id
    where wm.user_id = ${session.userId}
      and w.id = ${workspaceId}
    limit 1
  `) as unknown as Array<{ id: string; name: string; owner_id: string; role: string }>;

  const target = memberships[0];
  if (!target) {
    return NextResponse.json({ error: "Não tens acesso a este workspace" }, { status: 403 });
  }

  if (target.owner_id === session.userId) {
    const billing = await getBillingWorkspaceForWorkspace(workspaceId);
    if (!billing) return NextResponse.json({ error: "Workspace inválido" }, { status: 404 });
    const limit = getWorkspaceLimit(billing.plan_key);
    const owned = (await sql`
      select id
      from workspaces
      where owner_id = ${session.userId}::uuid
      order by created_at asc, id asc
    `) as unknown as Array<{ id: string }>;
    const targetIndex = owned.findIndex((item) => item.id === workspaceId);
    if (targetIndex >= limit) {
      return NextResponse.json(
        { error: `Este workspace está fora do limite do teu plano (${limit}). Faz upgrade para voltar a aceder.`, upgrade: true },
        { status: 403 },
      );
    }
  }

  const token = await createSessionToken(session.userId, workspaceId);
  const response = NextResponse.json({ ok: true, workspace: target });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
