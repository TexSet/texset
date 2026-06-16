import { NextResponse } from "next/server";
import {
  deleteProject,
  getProjectWithSource,
  renameProject,
  saveSource,
  touchProject,
} from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export function GET(_request: Request, { params }: Params) {
  const result = getProjectWithSource(params.id);
  if (!result) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  // opening a project counts as a visit, so it shows up under recents
  touchProject(params.id);
  return NextResponse.json(result);
}

export async function PATCH(request: Request, { params }: Params) {
  const body = await request.json().catch(() => ({}));

  const hasSource = typeof body.source === "string";
  const hasName = typeof body.name === "string";
  if (!hasSource && !hasName) {
    return NextResponse.json(
      { error: "Provide a name or source to update" },
      { status: 400 },
    );
  }

  let project = null;
  if (hasSource) project = saveSource(params.id, body.source);
  if (hasName) project = renameProject(params.id, body.name);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json(project);
}

export function DELETE(_request: Request, { params }: Params) {
  if (!deleteProject(params.id)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
