import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { normalizeClerkServerEnv } from "@/lib/clerk-env";
import { SESSION_COOKIE } from "@/lib/auth";

normalizeClerkServerEnv();

export async function POST(request: Request) {
  const { sessionId } = await auth();

  if (sessionId) {
    try {
      const client = await clerkClient();
      await client.sessions.revokeSession(sessionId);
    } catch (cause) {
      console.error("Clerk logout error:", cause);
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(SESSION_COOKIE, "", { path: "/", expires: new Date(0) });
  return response;
}
