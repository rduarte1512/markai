import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSql } from "@/lib/db";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const sql = getSql();
    const rows = (await sql`
      select
        u.id,
        u.password_hash,
        w.id as workspace_id,
        exists(
          select 1
          from brands b
          where b.workspace_id = w.id
            and b.status = 'active'
        ) as has_brand
      from users u
      join workspace_members wm on wm.user_id = u.id
      join workspaces w on w.id = wm.workspace_id
      where lower(u.email) = ${email}
      order by case wm.role when 'owner' then 0 else 1 end
      limit 1
    `) as unknown as Array<{
      id: string;
      password_hash: string;
      workspace_id: string;
      has_brand: boolean;
    }>;

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: "Email ou palavra-passe incorretos." }, { status: 401 });
    }

    const token = await createSessionToken(user.id, user.workspace_id);
    const response = NextResponse.json({
      ok: true,
      next: user.has_brand ? "/dashboard" : "/onboarding",
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (cause) {
    console.error("Login error:", cause);
    return NextResponse.json({ error: "Não foi possível entrar. Confirma a ligação ao Neon." }, { status: 500 });
  }
}
