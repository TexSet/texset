"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, X } from "lucide-react";
import type { CompileStatus } from "./useCompile";

interface CompileError {
  message: string;
  line: number | null;
}

// Pull the "! ..." errors out of a TeX log, pairing each with the "l.<n>" line
// reference that follows it when there is one.
function parseErrors(log: string): CompileError[] {
  const lines = log.split("\n");
  const errors: CompileError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.startsWith("! ")) continue;

    const message = line.slice(2).replace(/\.$/, "").trim();
    let lineNumber: number | null = null;
    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
      const match = /^l\.(\d+)/.exec(lines[j] ?? "");
      if (match) {
        lineNumber = Number(match[1]);
        break;
      }
    }
    errors.push({ message, line: lineNumber });
  }

  return errors;
}

interface CompileLogProps {
  log: string;
  status: CompileStatus;
  onClose: () => void;
  onGoToLine: (line: number) => void;
}

export function CompileLog({
  log,
  status,
  onClose,
  onGoToLine,
}: CompileLogProps) {
  const bodyRef = useRef<HTMLPreElement>(null);
  const errors = parseErrors(log);

  // follow the output as it streams in
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [log]);

  return (
    <div className="flex h-56 flex-col border-t border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-xs font-medium text-text-muted">
          {status === "running"
            ? "Compiling..."
            : errors.length > 0
              ? `${errors.length} error${errors.length === 1 ? "" : "s"}`
              : "Compile log"}
        </span>
        <button
          onClick={onClose}
          className="rounded p-1 text-text-muted transition hover:bg-surface-2 hover:text-text"
          aria-label="Close log"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {errors.length > 0 && (
        <ul className="max-h-24 shrink-0 overflow-auto border-b border-border">
          {errors.map((error, index) => (
            <li key={index}>
              <button
                onClick={() => error.line != null && onGoToLine(error.line)}
                disabled={error.line == null}
                className="flex w-full items-start gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-surface-2 disabled:cursor-default disabled:hover:bg-transparent"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                <span className="flex-1 text-text">{error.message}</span>
                {error.line != null && (
                  <span className="shrink-0 text-text-muted">line {error.line}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <pre
        ref={bodyRef}
        className="flex-1 overflow-auto whitespace-pre-wrap px-3 py-2 font-mono text-xs leading-relaxed text-text-muted"
      >
        {log || "No output yet."}
      </pre>
    </div>
  );
}
