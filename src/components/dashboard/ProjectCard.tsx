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
  return (
    <div className="group relative">
      <Link
        href={`/editor/${project.id}`}
        className="block overflow-hidden rounded-xl border border-border bg-surface shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
      >
        <ProjectThumbnail projectId={project.id} />

        <div className="space-y-1 p-3">
          <div className="flex items-center gap-1.5">
            {project.pinned && (
              <Pin className="h-3 w-3 shrink-0 fill-accent text-accent" />
            )}
            <span className="truncate font-medium">{project.name}</span>
          </div>
          <p className="text-xs text-text-muted" suppressHydrationWarning>
            Edited {formatRelativeTime(project.updatedAt)}
          </p>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-xs text-text-muted/70">
              Created {formatDate(project.createdAt)}
            </span>
            <span
              data-engine={project.engine}
              className="rounded bg-accent/12 px-1.5 py-0.5 text-[10px] font-medium text-accent"
            >
              {engines[project.engine].name}
            </span>
          </div>
        </div>
      </Link>

      {/* actions sit over the card; preventDefault keeps the link from firing */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={(event) => {
            event.preventDefault();
            onTogglePin(project);
          }}
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded-md bg-surface/90 shadow-soft backdrop-blur transition hover:bg-surface",
            project.pinned ? "text-accent" : "text-text-muted hover:text-text",
          )}
          aria-label={project.pinned ? "Unpin" : "Pin to top"}
          title={project.pinned ? "Unpin" : "Pin to top"}
        >
          <Pin className={clsx("h-3.5 w-3.5", project.pinned && "fill-accent")} />
        </button>
        <button
          onClick={(event) => {
            event.preventDefault();
            onDelete(project);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-surface/90 text-text-muted shadow-soft backdrop-blur transition hover:bg-surface hover:text-danger"
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
