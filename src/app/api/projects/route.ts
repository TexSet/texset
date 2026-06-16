import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(listProjects());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const project = createProject({
    name: typeof body.name === "string" ? body.name : undefined,
    engine: typeof body.engine === "string" ? body.engine : undefined,
    templateId: typeof body.templateId === "string" ? body.templateId : undefined,
  });

  return NextResponse.json(project, { status: 201 });
}
