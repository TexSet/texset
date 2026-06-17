import { NextResponse } from "next/server";
import { getEngine } from "@/lib/engines";
import { getProject } from "@/lib/projects";
import { listProjectFiles, safeFileName, writeProjectFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

// what can be uploaded: images and PDFs, the things \includegraphics handles
const UPLOADABLE = /\.(png|jpe?g|gif|webp|pdf)$/i;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function GET(_request: Request, { params }: Params) {
  const project = getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const mainFile = getEngine(project.engine).mainFileName;
  const files = listProjectFiles(params.id).map((file) => ({
    ...file,
    isMain: file.name === mainFile,
  }));
  return NextResponse.json(files);
}

export async function POST(request: Request, { params }: Params) {
  const project = getProject(params.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const name = safeFileName(file.name);
  if (!name || !UPLOADABLE.test(name)) {
    return NextResponse.json(
      { error: "Only images and PDFs can be uploaded" },
      { status: 400 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is too large" }, { status: 400 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  if (!writeProjectFile(params.id, name, data)) {
    return NextResponse.json({ error: "Could not save the file" }, { status: 400 });
  }

  return NextResponse.json({ name }, { status: 201 });
}
