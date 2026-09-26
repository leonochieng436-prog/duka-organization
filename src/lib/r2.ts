import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
  publicUrl?: string;
};

export function normalizeObjectKey(key: string) {
  return key.replace(/^\/+/, "").replace(/\/+/g, "/").replace(/\s+/g, "-").trim();
}

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const endpoint = process.env.R2_ENDPOINT?.trim();
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() || process.env.R2_PUBLIC_URL?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, endpoint, publicUrl };
}

export function assertR2Config(): R2Config {
  const config = getR2Config();

  if (!config) {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_ENDPOINT before uploading files."
    );
  }

  return config;
}

export function buildPublicObjectUrl(key: string) {
  const objectKey = normalizeObjectKey(key);
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() || process.env.R2_PUBLIC_URL?.trim();

  if (publicUrl) {
    const base = publicUrl.endsWith("/") ? publicUrl : `${publicUrl}/`;
    return new URL(objectKey, base).toString();
  }

  const endpoint = process.env.R2_ENDPOINT?.trim();
  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${objectKey}`;
  }

  return objectKey;
}

export const r2Config = getR2Config();

export const r2 = r2Config
  ? new S3Client({
      region: "auto",
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
      forcePathStyle: true,
    })
  : null;

export const R2_BUCKET_NAME = r2Config?.bucket ?? process.env.R2_BUCKET_NAME ?? "";

export function ensureProductionStorageEnv() {
  const config = getR2Config();

  if (!config) {
    throw new Error(
      "Missing Cloudflare R2 production variables: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT."
    );
  }

  if (process.env.NODE_ENV === "production" && !config.publicUrl) {
    console.warn("R2 public URL is not configured. Falling back to the bucket endpoint; this may not match your public CDN or custom domain.");
  }

  return config;
}

export async function uploadToR2(file: Buffer | Uint8Array, key: string, contentType: string) {
  const config = assertR2Config();

  if (!r2) {
    throw new Error("R2 client is unavailable because the storage environment variables are missing.");
  }

  const objectKey = normalizeObjectKey(key);
  await r2.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: Buffer.from(file),
      ContentType: contentType,
    })
  );

  return {
    key: objectKey,
    url: buildPublicObjectUrl(objectKey),
  };
}

export async function deleteFromR2(key: string) {
  const config = assertR2Config();

  if (!r2) {
    throw new Error("R2 client is unavailable because the storage environment variables are missing.");
  }

  const objectKey = normalizeObjectKey(key);
  await r2.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
    })
  );

  return objectKey;
}