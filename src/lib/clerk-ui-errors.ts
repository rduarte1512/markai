export function clerkErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const value = error as Record<string, unknown>;
  if (typeof value.code === "string") return value.code;
  if (value.error && typeof value.error === "object") {
    const nested = value.error as Record<string, unknown>;
    if (typeof nested.code === "string") return nested.code;
  }
  if (Array.isArray(value.errors)) {
    for (const item of value.errors) {
      if (item && typeof item === "object" && typeof (item as Record<string, unknown>).code === "string") {
        return (item as Record<string, unknown>).code as string;
      }
    }
  }
  return "";
}

export function clerkErrorMessage(error: unknown, fallback: string): string {
  const code = clerkErrorCode(error);
  if (code === "form_password_pwned") {
    return "Esta palavra-passe apareceu numa fuga de dados conhecida. Para tua segurança, escolhe uma palavra-passe diferente.";
  }
  if (code === "form_password_compromised") {
    return "Esta palavra-passe foi marcada como comprometida. Entra com Google ou redefine a palavra-passe para continuar.";
  }

  if (!error || typeof error !== "object") return fallback;
  const value = error as Record<string, unknown>;
  for (const key of ["longMessage", "long_message", "message", "shortMessage", "short_message"]) {
    if (typeof value[key] === "string" && String(value[key]).trim()) return String(value[key]).trim();
  }
  if (value.error && typeof value.error === "object") {
    const nested = value.error as Record<string, unknown>;
    for (const key of ["longMessage", "long_message", "message", "shortMessage", "short_message"]) {
      if (typeof nested[key] === "string" && String(nested[key]).trim()) return String(nested[key]).trim();
    }
  }
  if (Array.isArray(value.errors)) {
    for (const item of value.errors) {
      if (!item || typeof item !== "object") continue;
      const nested = item as Record<string, unknown>;
      for (const key of ["longMessage", "long_message", "message", "shortMessage", "short_message"]) {
        if (typeof nested[key] === "string" && String(nested[key]).trim()) return String(nested[key]).trim();
      }
    }
  }
  return fallback;
}

export function isCompromisedPasswordError(error: unknown): boolean {
  const code = clerkErrorCode(error);
  return code === "form_password_pwned" || code === "form_password_compromised";
}
