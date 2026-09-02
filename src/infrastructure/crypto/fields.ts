import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function keyFrom(value?: string) {
  if (!value) throw new Error("FIELD_ENCRYPTION_KEY_CURRENT no está configurada.");
  return createHash("sha256").update(value).digest();
}

export function encryptField(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(process.env.FIELD_ENCRYPTION_KEY_CURRENT), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptField(payload: string): string {
  const [version, ivValue, tagValue, encryptedValue] = payload.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) throw new Error("Formato cifrado inválido.");
  const candidates = [process.env.FIELD_ENCRYPTION_KEY_CURRENT, process.env.FIELD_ENCRYPTION_KEY_PREVIOUS].filter(Boolean) as string[];
  for (const candidate of candidates) {
    try {
      const decipher = createDecipheriv("aes-256-gcm", keyFrom(candidate), Buffer.from(ivValue, "base64url"));
      decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
      return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
    } catch { /* try previous key */ }
  }
  throw new Error("No fue posible descifrar el campo.");
}

export function secureHash(value: string): string {
  const secret = process.env.AUTH_SECRET ?? "development-only-secret";
  return createHash("sha256").update(`${secret}:${value}`).digest("hex");
}
