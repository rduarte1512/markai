import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { normalizeClerkServerEnv } from "@/lib/clerk-env";
import { getSql } from "@/lib/db";

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
      return NextResponse.json({ ok: true, alreadyLinked: true });
    }

    const { publishableKey, secretKey } = normalizeClerkServerEnv();
    const { createClerkClient } = await import("@clerk/nextjs/server");
    const client = createClerkClient({ publishableKey, secretKey });

    const existingClerkUsers = await client.users.getUserList({
      emailAddress: [user.email],
      limit: 1,
    });

    const existingClerkUser = existingClerkUsers.data[0];
    let clerkUserId: string;
    let createdNewUser = false;

    if (existingClerkUser) {
      if (existingClerkUser.externalId && existingClerkUser.externalId !== user.id) {
        return NextResponse.json(
          { error: "Este email já está ligado a outra conta MarkAI." },
          { status: 409 },
        );
      }

      const updated = await client.users.updateUser(existingClerkUser.id, {
        password,
        externalId: existingClerkUser.externalId || user.id,
        skipLegalChecks: true,
        skipPasswordChecks: true,
      });
      clerkUserId = updated.id;
    } else {
      const nameParts = user.name.trim().split(/\s+/);
      const created = await client.users.createUser({
        emailAddress: [user.email],
        password,
        firstName: nameParts[0] || undefined,
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined,
        externalId: user.id,
        skipLegalChecks: true,
        skipPasswordChecks: true,
      });
      clerkUserId = created.id;
      createdNewUser = true;
    }

    const attached = (await sql`
      update users
      set clerk_user_id = ${clerkUserId}, updated_at = now()
      where id = ${user.id}::uuid
        and (clerk_user_id is null or clerk_user_id = ${clerkUserId})
      returning id
    `) as unknown as Array<{ id: string }>;

    if (!attached[0]) {
      if (createdNewUser) {
        try { await client.users.deleteUser(clerkUserId); } catch {}
      }
      return NextResponse.json({ error: "Não foi possível ligar a conta." }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (cause) {
    console.error("Legacy Clerk migration error:", cause);
    return NextResponse.json({ error: "Não foi possível migrar esta conta para o novo login." }, { status: 500 });
  }
}
