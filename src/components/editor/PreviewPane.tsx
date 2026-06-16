"use client";

import { useEffect, useRef, useState } from "react";

type PreviewState = "loading" | "ready" | "empty" | "error";

interface PreviewPaneProps {
  projectId: string;
  // bumped after each successful compile so we know to re-render the PDF
  version: number;
}

// Renders the compiled PDF with pdf.js, one canvas per page. The worker is
// bundled from the package so it keeps working offline.
export function PreviewPane({ projectId, version }: PreviewPaneProps) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PreviewState>("loading");

  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => void } | null = null;

    async function render() {
      const container = pagesRef.current;
      const scroller = scrollRef.current;
      if (!container || !scroller) return;

      // nothing has been compiled yet on first open
      if (version === 0) {
        setState("empty");
        return;
      }

      setState("loading");

      const pdfjs = await import("pdfjs-dist");
      // the worker is copied into public/ by scripts/setup-pdf-worker.mjs
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      try {
        const task = pdfjs.getDocument(
          `/api/projects/${projectId}/pdf?v=${version}`,
        );
        loadingTask = task;
        const doc = await task.promise;
        if (cancelled) return;

        // keep the reading position across recompiles
        const previousScroll = scroller.scrollTop;
        container.replaceChildren();

        const targetWidth = Math.max(scroller.clientWidth - 48, 320);
        const dpr = window.devicePixelRatio || 1;

        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
          const page = await doc.getPage(pageNumber);
          if (cancelled) return;

          const unscaled = page.getViewport({ scale: 1 });
          const scale = targetWidth / unscaled.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          canvas.className = "mx-auto mb-4 rounded bg-white shadow-soft";

          const context = canvas.getContext("2d");
          if (!context) continue;
          context.scale(dpr, dpr);
          container.appendChild(canvas);

          await page.render({ canvasContext: context, viewport }).promise;
        }

        if (cancelled) return;
        scroller.scrollTop = previousScroll;
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    render();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [projectId, version]);

  return (
    <div ref={scrollRef} className="relative h-full overflow-auto bg-surface-2">
      <div ref={pagesRef} className="p-6" />

      {state !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {state === "loading" && (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          )}
          {state === "empty" && (
            <p className="text-sm text-text-muted">
              Compile to see the preview.
            </p>
          )}
          {state === "error" && (
            <p className="text-sm text-text-muted">
              No preview yet. Check the compile log for errors.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
