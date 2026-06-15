import { getProject } from "@/lib/projects";
import { compileProjectStream } from "@/lib/compiler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// compile a project and stream output via SSE
export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = compileProjectStream(id);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
