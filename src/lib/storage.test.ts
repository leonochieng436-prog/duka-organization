import { describe, expect, it } from "vitest";
import { buildPublicObjectUrl, getR2Config, normalizeObjectKey } from "./r2";

describe("R2 storage helpers", () => {
  it("normalizes bucket object keys", () => {
    expect(normalizeObjectKey("/organizations/acme/products/one.png")).toBe("organizations/acme/products/one.png");
  });

  it("builds a public URL from a configured bucket", () => {
    const originalEndpoint = process.env.R2_ENDPOINT;
    const originalBucket = process.env.R2_BUCKET_NAME;
    const originalPublic = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    const originalAccount = process.env.R2_ACCOUNT_ID;
    const originalAccess = process.env.R2_ACCESS_KEY_ID;
    const originalSecret = process.env.R2_SECRET_ACCESS_KEY;

    process.env.R2_ACCOUNT_ID = "account-id";
    process.env.R2_ACCESS_KEY_ID = "access-key";
    process.env.R2_SECRET_ACCESS_KEY = "secret-key";
    process.env.R2_ENDPOINT = "https://account.r2.cloudflarestorage.com";
    process.env.R2_BUCKET_NAME = "dukaos-storage";
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://cdn.example.com/dukaos-storage";

    try {
      expect(buildPublicObjectUrl("organizations/acme/logo.png")).toBe("https://cdn.example.com/dukaos-storage/organizations/acme/logo.png");
      expect(getR2Config()?.bucket).toBe("dukaos-storage");
    } finally {
      if (originalEndpoint === undefined) delete process.env.R2_ENDPOINT; else process.env.R2_ENDPOINT = originalEndpoint;
      if (originalBucket === undefined) delete process.env.R2_BUCKET_NAME; else process.env.R2_BUCKET_NAME = originalBucket;
      if (originalPublic === undefined) delete process.env.NEXT_PUBLIC_R2_PUBLIC_URL; else process.env.NEXT_PUBLIC_R2_PUBLIC_URL = originalPublic;
      if (originalAccount === undefined) delete process.env.R2_ACCOUNT_ID; else process.env.R2_ACCOUNT_ID = originalAccount;
      if (originalAccess === undefined) delete process.env.R2_ACCESS_KEY_ID; else process.env.R2_ACCESS_KEY_ID = originalAccess;
      if (originalSecret === undefined) delete process.env.R2_SECRET_ACCESS_KEY; else process.env.R2_SECRET_ACCESS_KEY = originalSecret;
    }
  });
});
