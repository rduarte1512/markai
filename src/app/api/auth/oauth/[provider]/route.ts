import { NextResponse } from "next/server";
import {
  createCodeChallenge,
  getOAuthCookieNames,
  getOAuthCredentials,
  getOAuthEndpoints,
  getOAuthProvider,
  getOAuthRedirectUri,
  oauthCookieOptions,
  oauthErrorUrl,
  randomOAuthValue,
} from "@/lib/oauth";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: rawProvider } = await params;
  const provider = getOAuthProvider(rawProvider);
  if (!provider) return NextResponse.redirect(new URL("/login", request.url));

  const credentials = getOAuthCredentials(provider);
  if (!credentials.clientId || !credentials.clientSecret) {
    return NextResponse.redirect(oauthErrorUrl(request, provider, "not_configured"));
  }

  const endpoints = getOAuthEndpoints(provider);
  const redirectUri = getOAuthRedirectUri(request, provider);
  const state = randomOAuthValue();
  const verifier = randomOAuthValue(48);
  const challenge = createCodeChallenge(verifier);

  const authorizeUrl = new URL(endpoints.authorize);
  authorizeUrl.searchParams.set("client_id", credentials.clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", endpoints.scope);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorizeUrl);
  const names = getOAuthCookieNames(provider);
  const options = oauthCookieOptions();
  response.cookies.set(names.state, state, options);
  response.cookies.set(names.verifier, verifier, options);
  return response;
}
