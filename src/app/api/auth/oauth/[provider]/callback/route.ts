import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { getSql } from "@/lib/db";
import {
  getOAuthCookieNames,
  getOAuthCredentials,
  getOAuthEndpoints,
  getOAuthProvider,
  getOAuthRedirectUri,
  oauthCookieOptions,
  oauthErrorUrl,
  safeEqual,
} from "@/lib/oauth";

export const runtime = "nodejs";

type ProviderProfile = {
  sub?: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  preferred_username?: string;
  picture?: string;
};

function validEmail(value: string) {
  return /^\S+@\S+\.\S{2,}$/.test(value);
}

function safePicture(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function clearOAuthCookies(response: NextResponse, provider: "google" | "microsoft") {
  const names = getOAuthCookieNames(provider);
  const options = oauthCookieOptions();
  response.cookies.set(names.state, "", { ...options, maxAge: 0 });
  response.cookies.set(names.verifier, "", { ...options, maxAge: 0 });
  return response;
}

function fail(request: Request, provider: "google" | "microsoft", code: string) {
  return clearOAuthCookies(NextResponse.redirect(oauthErrorUrl(request, provider, code)), provider);
}

async function getWorkspaceForUser(userId: string) {
  const sql = getSql();
  const rows = (await sql`
    select
      w.id as workspace_id,
      exists(
        select 1 from brands b
        where b.workspace_id = w.id and b.status = 'active'
      ) as has_brand
    from workspace_members wm
    join workspaces w on w.id = wm.workspace_id
    where wm.user_id = ${userId}::uuid
    order by case wm.role when 'owner' then 0 else 1 end, wm.joined_at asc
    limit 1
  `) as unknown as Array<{ workspace_id: string; has_brand: boolean }>;
  return rows[0] || null;
}

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: rawProvider } = await params;
  const provider = getOAuthProvider(rawProvider);
  if (!provider) return NextResponse.redirect(new URL("/login", request.url));

  try {
    const url = new URL(request.url);
    if (url.searchParams.get("error")) return fail(request, provider, "cancelled");

    const code = url.searchParams.get("code") || "";
    const returnedState = url.searchParams.get("state") || "";
    const cookieStore = await cookies();
    const names = getOAuthCookieNames(provider);
    const expectedState = cookieStore.get(names.state)?.value || "";
    const verifier = cookieStore.get(names.verifier)?.value || "";

    if (!code || !returnedState || !expectedState || !verifier || !safeEqual(returnedState, expectedState)) {
      return fail(request, provider, "invalid_state");
    }

    const credentials = getOAuthCredentials(provider);
    if (!credentials.clientId || !credentials.clientSecret) return fail(request, provider, "not_configured");

    const endpoints = getOAuthEndpoints(provider);
    const redirectUri = getOAuthRedirectUri(request, provider);
    const tokenBody = new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
    if (provider === "microsoft") tokenBody.set("scope", endpoints.scope);

    const tokenResponse = await fetch(endpoints.token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
      cache: "no-store",
    });
    if (!tokenResponse.ok) {
      console.error(`OAuth token exchange failed (${provider}):`, tokenResponse.status);
      return fail(request, provider, "token_exchange_failed");
    }

    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) return fail(request, provider, "token_exchange_failed");

    const profileResponse = await fetch(endpoints.userinfo, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: "no-store",
    });
    if (!profileResponse.ok) {
      console.error(`OAuth userinfo failed (${provider}):`, profileResponse.status);
      return fail(request, provider, "profile_failed");
    }

    const profile = (await profileResponse.json()) as ProviderProfile;
    const subject = String(profile.sub || "").trim();
    const rawEmail = String(profile.email || profile.preferred_username || "").trim().toLowerCase();
    const email = validEmail(rawEmail) ? rawEmail : "";
    const name = String(profile.name || email.split("@")[0] || "Utilizador MarkAI").trim().slice(0, 140);
    const picture = safePicture(profile.picture);

    if (!subject || !email) return fail(request, provider, "email_unavailable");
    if (provider === "google" && profile.email_verified !== true) return fail(request, provider, "email_unverified");

    const sql = getSql();
    const linkedRows = (await sql`
      select oa.user_id
      from oauth_accounts oa
      where oa.provider = ${provider} and oa.provider_user_id = ${subject}
      limit 1
    `) as unknown as Array<{ user_id: string }>;

    let userId = linkedRows[0]?.user_id || "";

    if (!userId) {
      const existingRows = (await sql`
        select id from users where lower(email) = ${email} limit 1
      `) as unknown as Array<{ id: string }>;
      userId = existingRows[0]?.id || "";

      if (!userId) {
        const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
        const registered = (await sql`
          select * from register_markai_user(
            ${name}, ${email}, ${passwordHash}, ${`${name} Workspace`}
          )
        `) as unknown as Array<{ user_id: string; workspace_id: string }>;
        userId = registered[0]?.user_id || "";
        if (!userId) throw new Error("OAUTH_USER_REGISTRATION_FAILED");
      }

      await sql`
        insert into oauth_accounts(user_id, provider, provider_user_id, provider_email)
        values (${userId}::uuid, ${provider}, ${subject}, ${email})
      `;
    } else {
      await sql`
        update oauth_accounts
        set provider_email = ${email}, updated_at = now()
        where provider = ${provider} and provider_user_id = ${subject}
      `;
    }

    if (picture) {
      await sql`update users set avatar_url = coalesce(avatar_url, ${picture}), updated_at = now() where id = ${userId}::uuid`;
    }

    const workspace = await getWorkspaceForUser(userId);
    if (!workspace) throw new Error("OAUTH_WORKSPACE_NOT_FOUND");

    const token = await createSessionToken(userId, workspace.workspace_id);
    const response = NextResponse.redirect(new URL(workspace.has_brand ? "/dashboard" : "/onboarding", request.url));
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return clearOAuthCookies(response, provider);
  } catch (cause) {
    console.error(`OAuth callback failed (${provider}):`, cause);
    return fail(request, provider, "oauth_failed");
  }
}
