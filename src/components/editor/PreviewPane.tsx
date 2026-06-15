"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
} from "lucide-react";

// Configure worker src on the client side
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PreviewPaneProps {
  pdfUrl: string | null;
  compiling: boolean;
}

export default function PreviewPane({ pdfUrl, compiling }: PreviewPaneProps) {
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF document when pdfUrl changes
  useEffect(() => {
    if (!pdfUrl) {
      Promise.resolve().then(() => {
        setPdf(null);
        setNumPages(0);
        setPageNumber(1);
        setError(null);
      });
      return;
    }

    Promise.resolve().then(() => {
      setLoading(true);
      setError(null);
    });

    const loadingTask = pdfjs.getDocument({ url: pdfUrl });
    loadingTask.promise.then(
      (loadedPdf) => {
        setPdf(loadedPdf);
        setNumPages(loadedPdf.numPages);
        setPageNumber((prev) => Math.min(prev, loadedPdf.numPages));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading PDF via pdf.js:", err);
        setError("Unable to render PDF. Please compile again.");
        setLoading(false);
      }
    );

    return () => {
      loadingTask.destroy();
    };
  }, [pdfUrl]);

  // Render the current page on the canvas
  useEffect(() => {
    if (!pdf) return;

    let isMounted = true;

    pdf.getPage(pageNumber).then(
      (page) => {
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        // Cancel previous render task if active
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        // Adjust scale for Retina / high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height * dpr;
        canvas.width = viewport.width * dpr;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.width = `${viewport.width}px`;

        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        renderTask.promise.then(
          () => {
            if (isMounted) {
              renderTaskRef.current = null;
            }
          },
          (err) => {
            if (err.name !== "RenderingCancelledException") {
              console.error("PDF render error:", err);
            }
          }
        );
      },
      (err) => {
        console.error("Failed to load page:", err);
      }
    );

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageNumber, scale]);

  // Zoom helpers
  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3.0));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const fitToWidth = () => {
    if (!pdf || !containerRef.current) return;
    pdf.getPage(pageNumber).then((page) => {
      const containerWidth = containerRef.current!.clientWidth - 48; // padding
      const viewport = page.getViewport({ scale: 1.0 });
      const newScale = containerWidth / viewport.width;
      setScale(newScale);
    });
  };

  const nextPage = () => {
    setPageNumber((p) => Math.min(p + 1, numPages));
  };

  const prevPage = () => {
    setPageNumber((p) => Math.max(p - 1, 1));
  };

  return (
    <div className="flex-1 flex flex-col bg-surface-overlay min-h-0 relative select-none">
      {/* Top Toolbar */}
      <div className="h-10 border-b border-border bg-surface-raised flex items-center justify-between px-4 shrink-0 glass z-10">
        {/* Page navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevPage}
            disabled={pageNumber <= 1 || loading}
            className="p-1 rounded hover:bg-surface-overlay disabled:opacity-35 transition-colors text-text-secondary"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-text-secondary font-medium min-w-[70px] text-center">
            {loading ? "Page --" : `Page ${pageNumber} of ${numPages || 1}`}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= numPages || loading}
            className="p-1 rounded hover:bg-surface-overlay disabled:opacity-35 transition-colors text-text-secondary"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={loading}
            className="p-1 rounded hover:bg-surface-overlay disabled:opacity-35 transition-colors text-text-secondary"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-mono text-text-muted min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={loading}
            className="p-1 rounded hover:bg-surface-overlay disabled:opacity-35 transition-colors text-text-secondary"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <div className="w-[1px] h-4 bg-border mx-1" />
          <button
            onClick={fitToWidth}
            disabled={loading}
            className="p-1 rounded hover:bg-surface-overlay disabled:opacity-35 transition-colors text-text-secondary"
            title="Fit to Width"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex justify-center items-start min-h-0"
      >
        {loading && !pdf ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted mt-20">
            <Loader2 className="animate-spin text-accent" size={24} />
            <span className="text-sm">Loading PDF...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted mt-20 text-center px-4">
            <span className="text-sm font-medium text-error">{error}</span>
            <span className="text-xs">Compile again to regenerate the layout</span>
          </div>
        ) : pdf ? (
          <div className="relative shadow-lg border border-border bg-white rounded-sm overflow-hidden mb-6">
            <canvas ref={canvasRef} className="block" />
            {compiling && (
              <div className="absolute inset-0 bg-surface/50 backdrop-blur-[1px] flex items-center justify-center">
                <div className="bg-surface-raised/90 border border-border px-3 py-1.5 rounded-md shadow-md flex items-center gap-2">
                  <Loader2 className="animate-spin text-accent" size={14} />
                  <span className="text-xs text-text-secondary font-medium">
                    Updating preview...
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted mt-20 text-center max-w-xs px-4">
            <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center border border-border mb-4">
              <Loader2 className="text-text-muted opacity-40 animate-pulse" size={20} />
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">
              No compiled PDF found
            </p>
            <p className="text-xs text-text-muted">
              Start editing or compile manually to render your PDF output.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
