import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getProject, touchUpdated } from "@/lib/projects";
import {
  deleteProjectFile,
  resolveProjectFile,
  safeFileName,
  writeProjectFile,
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string; name: string } };

// text files you can create and edit alongside main.tex
const TEXT_FILE = /\.(tex|txt|bib|cls|sty)$/i;

const MIME: Record<string, string> = {
  ".tex": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".bib": "text/plain; charset=utf-8",
  ".cls": "text/plain; charset=utf-8",
  ".sty": "text/plain; charset=utf-8",
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

// Writes a text file (creating it if needed). Used to edit secondary .tex files
// and to add new ones.
export async function PUT(request: Request, { params }: Params) {
  if (!getProject(params.id)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const name = safeFileName(params.name);
  if (!name || !TEXT_FILE.test(name)) {
    return NextResponse.json(
      { error: "Only text files can be written here" },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.content !== "string") {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }

  writeProjectFile(params.id, name, Buffer.from(body.content, "utf8"));
  touchUpdated(params.id);
  return NextResponse.json({ name });
}

export function DELETE(_request: Request, { params }: Params) {
  if (!deleteProjectFile(params.id, params.name)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
