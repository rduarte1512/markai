export function getClerkPublishableKey() {
  const key =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_markaioficial_CLERK_PUBLISHABLE_KEY
    || process.env.CLERK_PUBLISHABLE_KEY
    || "";

  if (!key) {
    throw new Error("Clerk publishable key não configurada no ambiente da MarkAI.");
  }

  return key;
}

export function getClerkSecretKey() {
  const key =
    process.env.CLERK_SECRET_KEY
    || process.env.markaioficial_CLERK_SECRET_KEY
    || "";

  if (!key) {
    throw new Error("Clerk secret key não configurada no ambiente da MarkAI.");
  }

  return key;
}

export function normalizeClerkServerEnv() {
  const publishableKey = getClerkPublishableKey();
  const secretKey = getClerkSecretKey();

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = publishableKey;
  }
  if (!process.env.CLERK_SECRET_KEY) {
    process.env.CLERK_SECRET_KEY = secretKey;
  }
  if (!process.env.CLERK_ENCRYPTION_KEY) {
    // Clerk encrypts the dynamic keys propagated by clerkMiddleware() and the
    // server-side auth() helper must decrypt them with the exact same value.
    // JWT_SECRET is already a stable private secret shared by Vercel runtimes,
    // so prefer it over deriving this value independently in each runtime.
    process.env.CLERK_ENCRYPTION_KEY = process.env.JWT_SECRET || secretKey;
  }

  return {
    publishableKey,
    secretKey,
    encryptionKey: process.env.CLERK_ENCRYPTION_KEY,
  };
}
