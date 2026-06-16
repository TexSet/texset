"use client";

import { useEffect, useRef, useState } from "react";
import type { CompileStatus } from "./useCompile";

type RenderState = "loading" | "ready" | "blank" | "error";

interface PreviewPaneProps {
  projectId: string;
  // bumped after each successful compile so we know to re-render the PDF
  version: number;
  // the compile outcome, used to explain why there's nothing to show yet
  documentStatus: CompileStatus;
}

// Renders the compiled PDF with pdf.js, one canvas per page. The worker is
// bundled from the package so it keeps working offline.
export function PreviewPane({
  projectId,
  version,
  documentStatus,
}: PreviewPaneProps) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RenderState>("blank");

  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => void } | null = null;

    async function render() {
      const container = pagesRef.current;
      const scroller = scrollRef.current;
      if (!container || !scroller) return;

      // no successful compile yet, so there's no PDF to render
      if (version === 0) {
        setState("blank");
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

  // pick the placeholder message for when there's no rendered PDF on screen
  const placeholder = (() => {
    if (documentStatus === "running") return null; // show the spinner instead
    if (documentStatus === "empty")
      return "This document is empty. Start writing to see the preview.";
    if (documentStatus === "error" || state === "error")
      return "No preview yet. Check the compile log for errors.";
    return "Compile to see the preview.";
  })();

  const showOverlay = state !== "ready";
  const showSpinner =
    state === "loading" || (state === "blank" && documentStatus === "running");

  return (
    <div ref={scrollRef} className="relative h-full overflow-auto bg-surface-2">
      <div ref={pagesRef} className="p-6" />

      {showOverlay && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center">
          {showSpinner ? (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : (
            <p className="max-w-xs text-sm text-text-muted">{placeholder}</p>
          )}
        </div>
      )}
    </div>
  );
}
