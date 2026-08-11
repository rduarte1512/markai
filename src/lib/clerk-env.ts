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
    // Clerk signs the request state in Proxy/Middleware and verifies it later in
    // server helpers such as auth(). Both runtimes must use the same key.
    // Clerk itself defaults this value to CLERK_SECRET_KEY, so mirror that
    // behavior instead of using the unrelated MarkAI JWT secret.
    process.env.CLERK_ENCRYPTION_KEY = secretKey;
  }

  return { publishableKey, secretKey };
}
