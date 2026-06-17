"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Images, Play, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { engines } from "@/lib/engines";
import type { Project } from "@/lib/projects";
import type { CompileStatus } from "./useCompile";

export type SaveState = "saved" | "saving" | "dirty";

interface ToolbarProps {
  project: Project;
  saveState: SaveState;
  status: CompileStatus;
  durationMs: number | null;
  hasPdf: boolean;
  onCompile: () => void;
  onToggleLog: () => void;
  onToggleFiles: () => void;
  onRename: (name: string) => void;
}

function statusLabel(
  status: CompileStatus,
  durationMs: number | null,
): { text: string; className: string } {
  switch (status) {
    case "running":
      return { text: "Compiling...", className: "text-text-muted" };
    case "success":
      return {
        text:
          durationMs != null
            ? `Compiled in ${(durationMs / 1000).toFixed(1)}s`
            : "Compiled",
        className: "text-accent",
      };
    case "warning":
      return { text: "Compiled with errors", className: "text-warning" };
    case "error":
      return { text: "Compile errors", className: "text-danger" };
    case "empty":
      return { text: "Empty document", className: "text-text-muted" };
    default:
      return { text: "", className: "" };
  }
}

export function Toolbar({
  project,
  saveState,
  status,
  durationMs,
  hasPdf,
  onCompile,
  onToggleLog,
  onToggleFiles,
  onRename,
}: ToolbarProps) {
  const [name, setName] = useState(project.name);
  useEffect(() => setName(project.name), [project.name]);

  const compileStatus = statusLabel(status, durationMs);

  function commitName() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== project.name) onRename(trimmed);
    else setName(project.name);
  }

  return (
    <header
      data-engine={project.engine}
      className="glass z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border px-4"
    >
      <Link
        href="/"
        className="flex items-center text-text-muted transition hover:text-text"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="min-w-0 max-w-xs rounded-md bg-transparent px-1.5 py-1 text-sm font-medium hover:bg-surface-2 focus:bg-surface-2"
        aria-label="Document name"
      />

      <span
        data-engine={project.engine}
        className="rounded-md bg-accent/12 px-2 py-0.5 text-xs font-medium text-accent"
      >
        {engines[project.engine].name}
      </span>

      <span className="text-xs text-text-muted">
        {saveState === "saving"
          ? "Saving..."
          : saveState === "dirty"
            ? "Unsaved"
            : "Saved"}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {compileStatus.text && (
          <span className={`text-xs font-medium ${compileStatus.className}`}>
            {compileStatus.text}
          </span>
        )}

        <Button variant="ghost" size="sm" icon={Images} onClick={onToggleFiles}>
          Files
        </Button>

        <Button variant="ghost" size="sm" icon={ScrollText} onClick={onToggleLog}>
          Log
        </Button>

        <a
          href={hasPdf ? `/api/projects/${project.id}/pdf` : undefined}
          download={hasPdf ? `${project.name}.pdf` : undefined}
        >
          <Button variant="secondary" size="sm" icon={Download} disabled={!hasPdf}>
            PDF
          </Button>
        </a>

        <Button
          size="sm"
          icon={Play}
          loading={status === "running"}
          onClick={onCompile}
        >
          Compile
        </Button>
      </div>
    </header>
  );
}
