import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getKey() {
  const source = process.env.INTEGRATIONS_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!source || source.length < 24) throw new Error("INTEGRATIONS_ENCRYPTION_KEY_NOT_CONFIGURED");
  return createHash("sha256").update(source).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(value: string) {
  const [ivRaw, tagRaw, dataRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !dataRaw) throw new Error("INVALID_ENCRYPTED_SECRET");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataRaw, "base64url")), decipher.final()]).toString("utf8");
}
