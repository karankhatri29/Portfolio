import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { MAX_UPLOAD_BYTES, detectImageType, safeUploadName } from "@/lib/upload";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    if (session.role !== "Admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Image uploads are not set up yet. Add a Blob store to the Vercel project first." }, { status: 501 });
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image file to upload" }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ error: "That file is empty" }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Images must be 4 MB or smaller" }, { status: 413 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImageType(bytes);
    if (!type) return NextResponse.json({ error: "Only PNG, JPEG, GIF and WebP images are allowed" }, { status: 415 });

    const blob = await put(safeUploadName(file.name, type.ext), file, { access: "public", contentType: type.mime, addRandomSuffix: true });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error("upload route failed", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
