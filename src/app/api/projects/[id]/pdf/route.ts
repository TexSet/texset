import fs from "node:fs";
import { getEngine } from "@/lib/engines";
import { getProject } from "@/lib/projects";
import { outputPdfPath } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serves the most recently compiled PDF for a project. The preview pane points
// an <iframe> or pdf.js at this route.
export function GET(_request: Request, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  const pdfPath = outputPdfPath(params.id, getEngine(project.engine));
  if (!fs.existsSync(pdfPath)) {
    return new Response("No compiled PDF yet", { status: 404 });
  }

  const data = fs.readFileSync(pdfPath);
  // hand back a plain view over the buffer so we don't copy the whole file
  const body = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(data.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
