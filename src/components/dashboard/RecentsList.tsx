"use client";

import { useRouter } from "next/navigation";
import { FileText, Clock, Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  template: string | null;
  updated_at: number;
  last_opened: number | null;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function RecentsList({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-medium text-text-secondary mb-3">Recent Projects</h2>
        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <FileText size={32} className="mb-2 opacity-40" />
          <p className="text-sm">No projects yet. Create one above to get started.</p>
        </div>
      </section>
    );
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setMenuOpen(null);

    const confirmed = window.confirm("Delete this project? This can't be undone.");
    if (!confirmed) return;

    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary mb-3">Recent Projects</h2>
      <div className="space-y-1">
        {projects.map((p) => (
          <div
            key={p.id}
            onClick={() => router.push(`/editor/${p.id}`)}
            className="group relative flex items-center gap-3 px-4 py-3 rounded-lg
                       hover:bg-surface-overlay cursor-pointer transition-colors duration-150"
          >
            <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
              <FileText size={18} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock size={11} className="text-text-muted" />
                <span className="text-xs text-text-muted">
                  {timeAgo(p.last_opened || p.updated_at)}
                </span>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === p.id ? null : p.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md
                           hover:bg-surface-overlay transition-opacity duration-150"
              >
                <MoreVertical size={14} className="text-text-muted" />
              </button>
              {menuOpen === p.id && (
                <div className="absolute right-0 top-8 z-10 w-36 py-1 rounded-lg border border-border
                              bg-surface-raised shadow-glass-lg animate-fade-in">
                  <button
                    onClick={(e) => handleDelete(e, p.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-error
                               hover:bg-surface-overlay transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete project
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
