import "server-only";
import { createCipheriv, randomBytes } from "node:crypto";

export function encryptEtimsSecret(value: string) {
  const rawKey = process.env.ETIMS_ENCRYPTION_KEY ?? process.env.MPESA_ENCRYPTION_KEY;
  if (!rawKey) throw new Error("ETIMS_ENCRYPTION_KEY is not configured.");
  const key = Buffer.from(rawKey, "base64");
  if (key.length !== 32) throw new Error("ETIMS_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}
