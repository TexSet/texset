import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { deleteProjectFile, resolveProjectFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string; name: string } };

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

// Serves a project file's bytes, used by the files panel to preview images.
export function GET(_request: Request, { params }: Params) {
  const filePath = resolveProjectFile(params.id, params.name);
  if (!filePath || !fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const data = fs.readFileSync(filePath);
  const body = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const type = MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";

  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(data.byteLength),
      "Cache-Control": "no-store",
    },
  });
}

export function DELETE(_request: Request, { params }: Params) {
  if (!deleteProjectFile(params.id, params.name)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
