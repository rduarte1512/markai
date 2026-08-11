import { clerkMiddleware } from "@clerk/nextjs/server";
import { normalizeClerkServerEnv } from "@/lib/clerk-env";

const { publishableKey, secretKey } = normalizeClerkServerEnv();

export default clerkMiddleware({ publishableKey, secretKey });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
