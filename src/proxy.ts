import type { NextFetchEvent, NextRequest } from "next/server";
import { normalizeClerkServerEnv } from "@/lib/clerk-env";

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Vercel exposes the connected Clerk credentials under project-scoped
  // fallback names. Normalize them before Clerk is evaluated, then pass the
  // resolved keys explicitly so middleware and auth() share the same request
  // state and encryption configuration.
  const { publishableKey, secretKey } = normalizeClerkServerEnv();

  const { clerkMiddleware } = await import("@clerk/nextjs/server");
  const handler = clerkMiddleware({ publishableKey, secretKey });
  return handler(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
