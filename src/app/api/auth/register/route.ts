import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSql } from "@/lib/db";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name || "").trim();
    const workspaceName = String(body.workspaceName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (name.length < 2 || workspaceName.length < 2) {
      return NextResponse.json({ error: "Preenche o teu nome e o nome da agência." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Introduz um email válido." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "A palavra-passe deve ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const sql = getSql();
    const rows = (await sql`
      select * from register_markai_user(${name}, ${email}, ${passwordHash}, ${workspaceName})
    `) as unknown as Array<{ user_id: string; workspace_id: string }>;

    const result = rows[0];
    if (!result) throw new Error("REGISTRATION_FAILED");

    const token = await createSessionToken(result.user_id, result.workspace_id);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    if (message.includes("EMAIL_ALREADY_EXISTS") || message.includes("users_email_key")) {
      return NextResponse.json({ error: "Já existe uma conta com este email." }, { status: 409 });
    }
    console.error("Register error:", cause);
    return NextResponse.json({ error: "Não foi possível criar a conta. Confirma a ligação ao Neon." }, { status: 500 });
  }
}
