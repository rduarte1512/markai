import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { getSql } from "@/lib/db";
import { getBillingWorkspaceForUser } from "@/lib/workspaces";
import type { AppContext, SessionPayload } from "@/lib/types";

export const SESSION_COOKIE = "markai_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("JWT_SECRET deve ter pelo menos 24 caracteres.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string, workspaceId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;

  return new SignJWT({ userId, workspaceId, expiresAt })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecret());
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId;
    const workspaceId = payload.workspaceId;
    const expiresAt = payload.expiresAt;

    if (
      typeof userId !== "string" ||
      typeof workspaceId !== "string" ||
      typeof expiresAt !== "number"
    ) {
      return null;
    }

    return { userId, workspaceId, expiresAt };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function getAppContext(): Promise<AppContext | null> {
  const session = await getSession();
  if (!session) return null;

  const sql = getSql();
  const billing = await getBillingWorkspaceForUser(session.userId, session.workspaceId);
  if (!billing) return null;

  await sql`
    with expired as (
      select workspace_id
      from subscriptions
      where workspace_id = ${billing.billing_workspace_id}::uuid
        and cancel_at_period_end = true
        and current_period_end <= now()
    ), updated_workspaces as (
      update workspaces
      set plan_key = 'free', updated_at = now()
      where owner_id = ${billing.owner_id}::uuid
        and exists (select 1 from expired)
      returning id
    ), updated_subscription as (
      update subscriptions
      set plan_key = 'free', status = 'canceled', cancel_at_period_end = false, updated_at = now()
      where workspace_id in (select workspace_id from expired)
      returning workspace_id
    )
    update credit_wallets
    set monthly_allowance = 60,
        monthly_balance = least(monthly_balance, 60),
        updated_at = now()
    where workspace_id = ${billing.billing_workspace_id}::uuid
      and exists (select 1 from expired)
  `;

  const rows = (await sql`
    select
      u.id as user_id,
      u.name as user_name,
      u.email,
      w.id as workspace_id,
      w.name as workspace_name,
      w.slug as workspace_slug,
      bw.id as billing_workspace_id,
      bw.plan_key,
      cw.monthly_balance,
      cw.extra_balance,
      cw.monthly_allowance,
      cw.period_end
    from users u
    join workspace_members wm on wm.user_id = u.id
    join workspaces w on w.id = wm.workspace_id
    join workspaces bw on bw.id = ${billing.billing_workspace_id}::uuid
    join credit_wallets cw on cw.workspace_id = bw.id
    where u.id = ${session.userId}
      and w.id = ${session.workspaceId}
    limit 1
  `) as unknown as AppContext[];

  return rows[0] ?? null;
}

export async function requireAppContext(): Promise<AppContext> {
  const context = await getAppContext();
  if (!context) {
    redirect("/login");
    throw new Error("UNREACHABLE");
  }
  return context;
}
