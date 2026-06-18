"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { CompileStatus } from "./useCompile";

type RenderState = "loading" | "ready" | "blank" | "error";

interface PreviewPaneProps {
  projectId: string;
  // bumped after each successful compile so we know to re-render the PDF
  version: number;
  // the compile outcome, used to explain why there's nothing to show yet
  documentStatus: CompileStatus;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.2;

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
  const [zoom, setZoom] = useState(1);

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

        const baseWidth = Math.max(scroller.clientWidth - 48, 280);
        const targetWidth = baseWidth * zoom;
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
  }, [projectId, version, zoom]);

  // pinch-to-zoom on a trackpad arrives as a wheel event with ctrlKey set. We
  // take over those to zoom the PDF; normal scrolling is left alone (and the
  // scrollbars show once a page is wider or taller than the pane).
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setZoom((z) =>
        Math.min(
          ZOOM_MAX,
          Math.max(ZOOM_MIN, Number((z - event.deltaY * 0.01).toFixed(2))),
        ),
      );
    }
    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, []);

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

  function changeZoom(delta: number) {
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((z + delta).toFixed(2)))));
  }

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

      {state === "ready" && (
        <div className="glass sticky bottom-4 left-1/2 flex w-fit -translate-x-1/2 items-center gap-1 rounded-full border border-border px-1 py-1 shadow-lift">
          <button
            onClick={() => changeZoom(-ZOOM_STEP)}
            disabled={zoom <= ZOOM_MIN}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-2 hover:text-text disabled:opacity-40"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="min-w-12 px-1 text-xs font-medium tabular-nums text-text-muted transition hover:text-text"
            aria-label="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => changeZoom(ZOOM_STEP)}
            disabled={zoom >= ZOOM_MAX}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-2 hover:text-text disabled:opacity-40"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
