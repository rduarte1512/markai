import bcrypt from "bcryptjs";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { normalizeClerkServerEnv } from "@/lib/clerk-env";
import { getSql } from "@/lib/db";

normalizeClerkServerEnv();

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!/^\S+@\S+\.\S{2,}$/.test(email) || password.length < 8) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 400 });
    }

    const sql = getSql();
    const rows = (await sql`
      select id, name, email, password_hash, clerk_user_id
      from users
      where lower(email) = ${email}
      limit 1
    `) as unknown as Array<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
      clerk_user_id: string | null;
    }>;

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: "Email ou palavra-passe incorretos." }, { status: 401 });
    }

    if (user.clerk_user_id) {
      return NextResponse.json({ error: "A conta já usa Clerk." }, { status: 409 });
    }

    const client = await clerkClient();
    const nameParts = user.name.trim().split(/\s+/);
    const created = await client.users.createUser({
      emailAddress: [user.email],
      password,
      firstName: nameParts[0] || undefined,
      lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined,
      externalId: user.id,
      skipLegalChecks: true,
    });

    const attached = (await sql`
      update users
      set clerk_user_id = ${created.id}, updated_at = now()
      where id = ${user.id}::uuid and clerk_user_id is null
      returning id
    `) as unknown as Array<{ id: string }>;

    if (!attached[0]) {
      try { await client.users.deleteUser(created.id); } catch {}
      return NextResponse.json({ error: "Não foi possível ligar a conta." }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (cause) {
    console.error("Legacy Clerk migration error:", cause);
    return NextResponse.json({ error: "Não foi possível migrar esta conta para o novo login." }, { status: 500 });
  }
}
