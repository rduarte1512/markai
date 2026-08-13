import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { getSql } from "@/lib/db";
import { normalizeClerkServerEnv } from "@/lib/clerk-env";
import { getBillingWorkspaceForUser } from "@/lib/workspaces";
import type { AppContext, SessionPayload } from "@/lib/types";

async function getConfiguredClerkClient() {
  const { publishableKey, secretKey } = normalizeClerkServerEnv();
  const { createClerkClient } = await import("@clerk/nextjs/server");
  return createClerkClient({ publishableKey, secretKey });
}

async function getAuthenticatedClerkUserId() {
  const { publishableKey, secretKey } = normalizeClerkServerEnv();
  const incomingHeaders = await headers();
  const requestHeaders = new Headers();
  incomingHeaders.forEach((value, key) => requestHeaders.append(key, value));

  const forwardedHost = incomingHeaders.get("x-forwarded-host") || incomingHeaders.get("host") || "markaioficial.vercel.app";
  const host = forwardedHost.split(",")[0].trim();
  const forwardedProto = incomingHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const protocol = forwardedProto.split(",")[0].trim();
  const origin = `${protocol}://${host}`;

  const client = await getConfiguredClerkClient();
  const requestState = await client.authenticateRequest(
    new Request(`${origin}/`, { headers: requestHeaders }),
    {
      publishableKey,
      secretKey,
      authorizedParties: Array.from(new Set([
        origin,
        "https://markaioficial.vercel.app",
        "https://markaioficial-zetawebs-projects.vercel.app",
        "https://markaioficial-git-main-zetawebs-projects.vercel.app",
        "http://localhost:3000",
      ])),
    },
  );

  if (!requestState.isAuthenticated) return null;
  return requestState.toAuth().userId || null;
}

/**
 * Clerk is the authentication source of truth. This cookie only keeps the
 * currently selected MarkAI workspace and is always revalidated against Neon.
 */
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

type MarkAIUser = {
  id: string;
  email: string;
};

function metadataText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function getOrCreateMarkAIUser(clerkUserId: string): Promise<MarkAIUser | null> {
  const sql = getSql();
  const linked = (await sql`
    select id, email
    from users
    where clerk_user_id = ${clerkUserId}
    limit 1
  `) as unknown as MarkAIUser[];
  if (linked[0]) return linked[0];

  const client = await getConfiguredClerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const primaryEmail = clerkUser.emailAddresses.find(
    (item) => item.id === clerkUser.primaryEmailAddressId,
  ) ?? clerkUser.emailAddresses[0];
  const email = primaryEmail?.emailAddress?.trim().toLowerCase() || "";
  if (!email) return null;

  const requestedName = metadataText(clerkUser.unsafeMetadata?.markaiName, 140);
  const requestedWorkspaceName = metadataText(clerkUser.unsafeMetadata?.workspaceName, 140);
  const providerName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim();
  const name = requestedName || providerName || email.split("@")[0] || "Utilizador MarkAI";
  const workspaceName = requestedWorkspaceName || `${name.slice(0, 100)} Workspace`;

  const existing = (await sql`
    select id, email, clerk_user_id
    from users
    where lower(email) = ${email}
    limit 1
  `) as unknown as Array<MarkAIUser & { clerk_user_id: string | null }>;

  if (existing[0]) {
    if (existing[0].clerk_user_id && existing[0].clerk_user_id !== clerkUserId) {
      throw new Error("CLERK_EMAIL_ALREADY_LINKED");
    }

    const attached = (await sql`
      update users
      set clerk_user_id = ${clerkUserId},
          avatar_url = coalesce(avatar_url, ${clerkUser.imageUrl || null}),
          updated_at = now()
      where id = ${existing[0].id}::uuid
        and (clerk_user_id is null or clerk_user_id = ${clerkUserId})
      returning id, email
    `) as unknown as MarkAIUser[];
    return attached[0] ?? null;
  }

  const generatedPassword = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
  const registered = (await sql`
    select * from register_markai_user(
      ${name.slice(0, 140)},
      ${email},
      ${generatedPassword},
      ${workspaceName}
    )
  `) as unknown as Array<{ user_id: string; workspace_id: string }>;
  const createdUserId = registered[0]?.user_id;
  if (!createdUserId) return null;

  const attached = (await sql`
    update users
    set clerk_user_id = ${clerkUserId},
        avatar_url = coalesce(avatar_url, ${clerkUser.imageUrl || null}),
        updated_at = now()
    where id = ${createdUserId}::uuid
    returning id, email
  `) as unknown as MarkAIUser[];

  return attached[0] ?? null;
}

async function getPreferredWorkspace(userId: string) {
  const sql = getSql();
  const rows = (await sql`
    select w.id as workspace_id
    from workspace_members wm
    join workspaces w on w.id = wm.workspace_id
    where wm.user_id = ${userId}::uuid
    order by case wm.role when 'owner' then 0 else 1 end, wm.joined_at asc
  `) as unknown as Array<{ workspace_id: string }>;

  if (!rows.length) return null;

  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) {
      const { payload } = await jwtVerify(token, getSecret());
      const cookieUserId = typeof payload.userId === "string" ? payload.userId : "";
      const cookieWorkspaceId = typeof payload.workspaceId === "string" ? payload.workspaceId : "";
      if (
        cookieUserId === userId
        && rows.some((row) => row.workspace_id === cookieWorkspaceId)
      ) {
        return cookieWorkspaceId;
      }
    }
  } catch {
    // A stale workspace cookie never grants access; Clerk remains the auth source.
  }

  return rows[0].workspace_id;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const clerkUserId = await getAuthenticatedClerkUserId();
    if (!clerkUserId) return null;

    const user = await getOrCreateMarkAIUser(clerkUserId);
    if (!user) return null;

    const workspaceId = await getPreferredWorkspace(user.id);
    if (!workspaceId) return null;

    return {
      userId: user.id,
      workspaceId,
      expiresAt: Math.floor(Date.now() / 1000) + 60 * 60,
    };
  } catch (cause) {
    console.error("Clerk direct session validation error:", cause);
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
