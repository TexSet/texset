"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { engines } from "@/lib/engines";
import { formatRelativeTime } from "@/lib/format";
import type { Project } from "@/lib/projects";

export function RecentsList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/50 p-10 text-center">
        <p className="text-text-muted">
          No documents yet. Start with a blank document or pick a template above.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/editor/${project.id}`}
            className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/12 text-accent">
              <FileText className="h-4 w-4" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-text">
                {project.name}
              </span>
              <span
                className="block text-sm text-text-muted"
                suppressHydrationWarning
              >
                Edited {formatRelativeTime(project.updatedAt)}
              </span>
            </span>

            <span
              data-engine={project.engine}
              className="rounded-md bg-accent/12 px-2 py-0.5 text-xs font-medium text-accent"
            >
              {engines[project.engine].name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
