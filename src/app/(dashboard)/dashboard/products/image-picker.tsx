"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_IMAGE_BYTES = 750_000;

export function ProductImagePicker({ initialValue = "" }: { initialValue?: string }) {
  const [preview, setPreview] = useState(initialValue);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleChange(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be smaller than 750 KB.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "products");

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string; url?: string };
      if (!response.ok || !payload.ok || !payload.url) {
        throw new Error(payload.error || "Image upload failed.");
      }

      setPreview(payload.url);
    } catch (uploadError) {
      setPreview("");
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="productImage">Product image</Label>
      <Input
        id="productImage"
        name="imageFile"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(event) => void handleChange(event.target.files?.[0])}
        className="h-auto py-2"
        disabled={isUploading}
      />
      <input type="hidden" name="imageUrl" value={preview} readOnly />
      {preview && (
        <div className="flex items-center gap-3">
          <img src={preview} alt="Product preview" className="h-20 w-20 rounded border object-cover" />
          <button
            type="button"
            className="text-[13px] text-danger underline"
            onClick={() => setPreview("")}
          >
            Remove image
          </button>
        </div>
      )}
      {error && <p className="text-[12px] text-danger">{error}</p>}
      {isUploading && <p className="text-[12px] text-muted-foreground">Uploading image…</p>}
      <p className="text-[12px] text-muted-foreground">JPG, PNG, WEBP, or GIF up to 750 KB.</p>
    </div>
  );
}
