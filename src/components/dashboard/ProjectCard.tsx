"use client";

import Link from "next/link";
import { Pin, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { engines } from "@/lib/engines";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { Project } from "@/lib/projects";
import { ProjectThumbnail } from "./ProjectThumbnail";

interface ProjectCardProps {
  project: Project;
  onTogglePin: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({
  project,
  onTogglePin,
  onDelete,
}: ProjectCardProps) {
  // data-engine sets the accent (green for LaTeX, blue for Typst) for everything
  // tinted in this card: the top stripe, the badge, and the pinned ring
  return (
    <div className="group relative" data-engine={project.engine}>
      <Link
        href={`/editor/${project.id}`}
        className={clsx(
          "block overflow-hidden rounded-xl border bg-surface shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift",
          project.pinned ? "border-accent ring-1 ring-accent" : "border-border",
        )}
      >
        <div className="h-1 bg-accent" />
        <ProjectThumbnail projectId={project.id} />

        <div className="space-y-1 p-3">
          <span className="block truncate font-medium">{project.name}</span>
          <p className="text-xs text-text-muted" suppressHydrationWarning>
            Edited {formatRelativeTime(project.updatedAt)}
          </p>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-xs text-text-muted/70">
              Created {formatDate(project.createdAt)}
            </span>
            <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
              {engines[project.engine].name}
            </span>
          </div>
        </div>
      </Link>

      {/* actions sit over the card; preventDefault keeps the link from firing */}
      <div className="absolute right-2 top-3 flex gap-1">
        <button
          onClick={(event) => {
            event.preventDefault();
            onTogglePin(project);
          }}
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded-md shadow-soft backdrop-blur transition",
            project.pinned
              ? "bg-accent text-accent-fg"
              : "bg-surface/90 text-text-muted opacity-0 hover:text-text group-hover:opacity-100",
          )}
          aria-label={project.pinned ? "Unpin" : "Pin to top"}
          title={project.pinned ? "Unpin" : "Pin to top"}
        >
          <Pin className={clsx("h-3.5 w-3.5", project.pinned && "fill-current")} />
        </button>
        <button
          onClick={(event) => {
            event.preventDefault();
            onDelete(project);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-surface/90 text-text-muted opacity-0 shadow-soft backdrop-blur transition hover:text-danger group-hover:opacity-100"
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
