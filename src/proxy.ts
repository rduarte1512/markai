import type { NextFetchEvent, NextRequest } from "next/server";
import { getClerkPublishableKey, getClerkSecretKey } from "@/lib/clerk-env";

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = getClerkPublishableKey();
  }
  if (!process.env.CLERK_SECRET_KEY) {
    process.env.CLERK_SECRET_KEY = getClerkSecretKey();
  }

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
