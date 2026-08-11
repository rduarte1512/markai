import type { NextFetchEvent, NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { normalizeClerkServerEnv } from "@/lib/clerk-env";

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  // The CI build intentionally has no Clerk secrets. Resolve the production
  // keys only when a real request reaches Proxy, before Clerk creates the
  // signed request-state consumed by server-side auth().
  normalizeClerkServerEnv();
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
