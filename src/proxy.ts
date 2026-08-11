import { clerkMiddleware } from "@clerk/nextjs/server";
import { normalizeClerkServerEnv } from "@/lib/clerk-env";

// Normalize the fallback Vercel variable names before Clerk creates the
// request-state bridge consumed by server-side auth().
normalizeClerkServerEnv();

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
