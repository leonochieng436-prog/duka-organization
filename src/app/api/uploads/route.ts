import { NextResponse } from "next/server";
import { requireAuthContext } from "@/server/auth/context";
import { assertR2Config, normalizeObjectKey, uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext();
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "products").trim() || "products";

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "A file is required." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Only image uploads are allowed." }, { status: 400 });
    }

    if (file.size > 750 * 1024) {
      return NextResponse.json({ ok: false, error: "Image must be smaller than 750 KB." }, { status: 400 });
    }

    assertR2Config();

    const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "jpg" : "jpg";
    const objectKey = normalizeObjectKey(`${folder}/${ctx.organizationId}/${Date.now()}-${crypto.randomUUID()}.${extension}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToR2(buffer, objectKey, file.type || "image/jpeg");

    return NextResponse.json({ ok: true, key: result.key, url: result.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    const status = message.includes("not configured") || message.includes("Missing") ? 500 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
