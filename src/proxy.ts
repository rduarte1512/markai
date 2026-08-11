import { clerkMiddleware } from "@clerk/nextjs/server";
import { normalizeClerkServerEnv } from "@/lib/clerk-env";

const { publishableKey } = normalizeClerkServerEnv();

export default clerkMiddleware({ publishableKey });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
