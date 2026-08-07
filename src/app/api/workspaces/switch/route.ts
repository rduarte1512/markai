import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSession,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { workspaceId?: string } | null;
  const workspaceId = body?.workspaceId?.trim();
  if (!workspaceId) return NextResponse.json({ error: "Workspace inválido" }, { status: 400 });

  const sql = getSql();
  const memberships = (await sql`
    select w.id, w.name
    from workspace_members wm
    join workspaces w on w.id = wm.workspace_id
    where wm.user_id = ${session.userId}
      and w.id = ${workspaceId}
    limit 1
  `) as unknown as Array<{ id: string; name: string }>;

  if (!memberships[0]) {
    return NextResponse.json({ error: "Não tens acesso a este workspace" }, { status: 403 });
  }

  const token = await createSessionToken(session.userId, workspaceId);
  const response = NextResponse.json({ ok: true, workspace: memberships[0] });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
