import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const body = (await request.json()) as { conversationId?: string; title?: string };
    const conversationId = String(body.conversationId || "");
    const title = String(body.title || "").trim().replace(/\s+/g, " ");

    if (!conversationId || title.length < 2) {
      return NextResponse.json({ error: "Indica um nome válido para a conversa." }, { status: 400 });
    }
    if (title.length > 80) {
      return NextResponse.json({ error: "O nome da conversa não pode ultrapassar 80 caracteres." }, { status: 400 });
    }

    const sql = getSql();
    const rows = (await sql`
      update ai_conversations
      set title = ${title}, updated_at = now()
      where id = ${conversationId}::uuid
        and workspace_id = ${session.workspaceId}::uuid
        and user_id = ${session.userId}::uuid
      returning id, title, updated_at
    `) as unknown as Array<{ id: string; title: string; updated_at: string }>;

    if (!rows[0]) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    return NextResponse.json({ conversation: rows[0] });
  } catch (cause) {
    console.error("Conversation rename error:", cause);
    return NextResponse.json({ error: "Não foi possível renomear a conversa." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId") || "";
    if (!conversationId) return NextResponse.json({ error: "Conversa inválida." }, { status: 400 });

    const sql = getSql();
    const rows = (await sql`
      delete from ai_conversations
      where id = ${conversationId}::uuid
        and workspace_id = ${session.workspaceId}::uuid
        and user_id = ${session.userId}::uuid
      returning id
    `) as unknown as Array<{ id: string }>;

    if (!rows[0]) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    return NextResponse.json({ deleted: true, id: rows[0].id });
  } catch (cause) {
    console.error("Conversation delete error:", cause);
    return NextResponse.json({ error: "Não foi possível eliminar a conversa." }, { status: 500 });
  }
}
