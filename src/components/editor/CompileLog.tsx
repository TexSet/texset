"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { CompileStatus } from "./useCompile";

interface CompileLogProps {
  log: string;
  status: CompileStatus;
  onClose: () => void;
}

export function CompileLog({ log, status, onClose }: CompileLogProps) {
  const bodyRef = useRef<HTMLPreElement>(null);

  // follow the output as it streams in
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [log]);

  return (
    <div className="flex h-48 flex-col border-t border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-xs font-medium text-text-muted">
          {status === "running" ? "Compiling..." : "Compile log"}
        </span>
        <button
          onClick={onClose}
          className="rounded p-1 text-text-muted transition hover:bg-surface-2 hover:text-text"
          aria-label="Close log"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <pre
        ref={bodyRef}
        className="flex-1 overflow-auto whitespace-pre-wrap px-3 py-2 font-mono text-xs leading-relaxed text-text-muted"
      >
        {log || "No output yet."}
      </pre>
    </div>
  );
}
