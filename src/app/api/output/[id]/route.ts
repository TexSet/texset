import { NextResponse } from "next/server";
import { getProject } from "@/lib/projects";
import { getOutputPdfPath } from "@/lib/storage";
import fs from "fs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// serve the compiled PDF
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const pdfPath = getOutputPdfPath(id);
  if (!fs.existsSync(pdfPath)) {
    return NextResponse.json({ error: "PDF not compiled yet" }, { status: 404 });
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${project.name}.pdf"`,
    },
  });
}
