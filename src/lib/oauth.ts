import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type OAuthProvider = "google" | "microsoft";

const OAUTH_STATE_MAX_AGE = 10 * 60;

export function getOAuthProvider(value: string): OAuthProvider | null {
  return value === "google" || value === "microsoft" ? value : null;
}

export function getOAuthCookieNames(provider: OAuthProvider) {
  return {
    state: `markai_oauth_state_${provider}`,
    verifier: `markai_oauth_verifier_${provider}`,
  };
}

export function oauthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth/oauth",
    maxAge: OAUTH_STATE_MAX_AGE,
  };
}

export function randomOAuthValue(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function createCodeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function getOAuthBaseUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export function getOAuthRedirectUri(request: Request, provider: OAuthProvider) {
  return `${getOAuthBaseUrl(request)}/api/auth/oauth/${provider}/callback`;
}

export function getOAuthCredentials(provider: OAuthProvider) {
  if (provider === "google") {
    return {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() || "",
    };
  }

  return {
    clientId: process.env.MICROSOFT_OAUTH_CLIENT_ID?.trim() || "",
    clientSecret: process.env.MICROSOFT_OAUTH_CLIENT_SECRET?.trim() || "",
  };
}

function microsoftTenant() {
  const tenant = process.env.MICROSOFT_OAUTH_TENANT?.trim() || "common";
  return /^[a-zA-Z0-9.-]+$/.test(tenant) ? tenant : "common";
}

export function getOAuthEndpoints(provider: OAuthProvider) {
  if (provider === "google") {
    return {
      authorize: "https://accounts.google.com/o/oauth2/v2/auth",
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
      scope: "openid profile email",
    };
  }

  const tenant = microsoftTenant();
  return {
    authorize: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    token: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    userinfo: "https://graph.microsoft.com/oidc/userinfo",
    scope: "openid profile email",
  };
}

export function oauthErrorUrl(request: Request, provider: OAuthProvider, code: string) {
  const url = new URL("/login", getOAuthBaseUrl(request));
  url.searchParams.set("oauth_error", code);
  url.searchParams.set("provider", provider);
  return url;
}
