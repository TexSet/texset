"use client";

import { useEffect, useState } from "react";
import { TriangleAlert, X } from "lucide-react";

// Shows a clear, app-wide notice when no LaTeX engine is available, so people
// know why nothing compiles and how to fix it, instead of being surprised.
export function TexStatusBanner() {
  const [missing, setMissing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/tex-status")
      .then((res) => res.json())
      .then((data) => setMissing(!data.available))
      .catch(() => setMissing(false));
  }, []);

  if (!missing || dismissed) return null;

  return (
    <div className="flex items-start gap-3 border-b border-warning/40 bg-warning/10 px-4 py-2 text-sm text-text">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p className="flex-1">
        No LaTeX engine was found, so documents can&apos;t compile yet. Install{" "}
        <a
          href="https://miktex.org/download"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-accent underline"
        >
          MiKTeX
        </a>{" "}
        on Windows or{" "}
        <a
          href="https://tug.org/texlive/"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-accent underline"
        >
          TeX Live
        </a>{" "}
        on macOS/Linux — or use the TexSet desktop app, which already includes one.
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 text-text-muted transition hover:text-text"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
