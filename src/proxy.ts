import type { NextFetchEvent, NextRequest } from "next/server";
import { normalizeClerkServerEnv } from "@/lib/clerk-env";

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Some Vercel environments expose the MarkAI Clerk keys under the project-
  // scoped fallback names. Normalize them before loading Clerk so middleware
  // and server auth use the same publishable, secret, and encryption keys.
  normalizeClerkServerEnv();

  const { clerkMiddleware } = await import("@clerk/nextjs/server");
  const handler = clerkMiddleware();
  return handler(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
