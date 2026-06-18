"use client";

import { useCallback, useEffect, useState } from "react";
import { Pin } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Project } from "@/lib/projects";
import { ProjectCard } from "./ProjectCard";

const PAGE_SIZE = 8;

// pinned first, then most recently opened or edited
function sortProjects(list: Project[]): Project[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.lastOpenedAt ?? b.updatedAt) - (a.lastOpenedAt ?? a.updatedAt);
  });
}

export function ProjectsGallery({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [showAll, setShowAll] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  // Always pull a fresh list when the dashboard mounts or regains focus. This is
  // what keeps deleted or newly created projects from lingering when you come
  // back from the editor, instead of trusting a cached page.
  const refetch = useCallback(async () => {
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
  }, []);

  useEffect(() => {
    refetch();
    const onFocus = () => refetch();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refetch]);

  async function togglePin(project: Project) {
    const pinned = !project.pinned;
    setProjects((prev) =>
      sortProjects(prev.map((p) => (p.id === project.id ? { ...p, pinned } : p))),
    );
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    });
  }

  async function renameProject(project: Project, name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, name: trimmed } : p)),
    );
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
  }

  async function confirmDelete() {
    const target = pendingDelete;
    if (!target) return;
    setPendingDelete(null);
    setProjects((prev) => prev.filter((p) => p.id !== target.id));
    await fetch(`/api/projects/${target.id}`, { method: "DELETE" });
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/50 p-10 text-center">
        <p className="text-text-muted">
          No documents yet. Create one with New document or pick a template above.
        </p>
      </div>
    );
  }

  const pinned = projects.filter((p) => p.pinned);
  const rest = projects.filter((p) => !p.pinned);
  const visibleRest = showAll ? rest : rest.slice(0, PAGE_SIZE);

  const card = (project: Project) => (
    <ProjectCard
      key={project.id}
      project={project}
      onTogglePin={togglePin}
      onDelete={setPendingDelete}
      onRename={renameProject}
    />
  );

  return (
    <div className="space-y-6">
      {pinned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
            <Pin className="h-3.5 w-3.5 fill-current" />
            Pinned
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {pinned.map(card)}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {pinned.length > 0 && rest.length > 0 && (
          <div className="text-sm font-medium text-text-muted">Recent</div>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibleRest.map(card)}
        </div>
        {rest.length > PAGE_SIZE && (
          <button
            onClick={() => setShowAll((open) => !open)}
            className="text-sm font-medium text-accent transition hover:brightness-110"
          >
            {showAll ? "Show less" : `Show all ${rest.length}`}
          </button>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete document"
          message={`"${pendingDelete.name}" and its files will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
