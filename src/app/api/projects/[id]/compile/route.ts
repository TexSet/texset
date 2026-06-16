import { compileStream } from "@/lib/compiler";
import { getProject } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compiles the project and streams the log back as Server-Sent Events. The
// client reads it to show progress and learn when the new PDF is ready.
export function POST(_request: Request, { params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(compileStream(params.id, project.engine), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
