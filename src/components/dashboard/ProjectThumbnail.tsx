"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";

type ThumbnailState = "loading" | "ready" | "none";

// Renders the first page of a project's compiled PDF as a small preview, the
// way Word shows a document thumbnail. Falls back to an icon when the project
// hasn't been compiled yet.
export function ProjectThumbnail({ projectId }: { projectId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<ThumbnailState>("loading");

  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => void } | null = null;

    async function render() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjs.getDocument(`/api/projects/${projectId}/pdf`);
        task = loadingTask;
        const doc = await loadingTask.promise;
        if (cancelled) return;

        const page = await doc.getPage(1);
        if (cancelled) return;

        const width = canvas.parentElement?.clientWidth ?? 240;
        const unscaled = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: width / unscaled.width });
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = "100%";

        const context = canvas.getContext("2d");
        if (!context) return;
        context.scale(dpr, dpr);

        await page.render({ canvasContext: context, viewport }).promise;
        if (!cancelled) setState("ready");
      } catch {
        if (!cancelled) setState("none");
      }
    }

    render();
    return () => {
      cancelled = true;
      task?.destroy();
    };
  }, [projectId]);

  return (
    <div className="relative h-44 overflow-hidden border-b border-border bg-white">
      <canvas ref={canvasRef} className={state === "ready" ? "block" : "hidden"} />
      {state !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
          {state === "loading" ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : (
            <FileText className="h-8 w-8 text-text-muted/40" />
          )}
        </div>
      )}
    </div>
  );
}
