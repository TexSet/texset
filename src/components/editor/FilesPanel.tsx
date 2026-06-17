"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { FileText, Trash2, Upload } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ProjectFile {
  name: string;
  size: number;
  kind: "tex" | "image" | "pdf" | "other";
  isMain: boolean;
}

interface FilesPanelProps {
  projectId: string;
  // insert a reference to an uploaded image at the editor cursor
  onInsertImage: (name: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesPanel({ projectId, onInsertImage }: FilesPanelProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProjectFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/files`);
    if (res.ok) setFiles(await res.json());
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (list: FileList | File[]) => {
      setUploading(true);
      for (const file of Array.from(list)) {
        const form = new FormData();
        form.append("file", file);
        await fetch(`/api/projects/${projectId}/files`, {
          method: "POST",
          body: form,
        });
      }
      setUploading(false);
      refresh();
    },
    [projectId, refresh],
  );

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { name } = pendingDelete;
    setPendingDelete(null);
    await fetch(`/api/projects/${projectId}/files/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    refresh();
  }

  return (
    <div
      className={clsx(
        "flex h-full w-60 shrink-0 flex-col border-r border-border bg-surface",
        dragging && "ring-2 ring-inset ring-accent",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer.files.length) upload(event.dataTransfer.files);
      }}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-text-muted">Files</span>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-accent transition hover:bg-accent/10"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.gif,.webp,.pdf"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) upload(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <div className="flex-1 overflow-auto p-2">
        {uploading && (
          <p className="px-1 py-2 text-xs text-text-muted">Uploading...</p>
        )}

        {files.length === 0 && !uploading ? (
          <p className="px-1 py-6 text-center text-xs text-text-muted">
            Drop images here or use Upload, then click one to insert it.
          </p>
        ) : (
          <ul className="space-y-1">
            {files.map((file) => (
              <li key={file.name} className="group relative">
                {file.kind === "image" ? (
                  <button
                    onClick={() => onInsertImage(file.name)}
                    className="w-full overflow-hidden rounded-lg border border-border text-left transition hover:border-accent"
                    title={`Insert ${file.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/projects/${projectId}/files/${encodeURIComponent(file.name)}`}
                      alt={file.name}
                      className="h-20 w-full bg-white object-contain"
                    />
                    <span className="block truncate px-2 py-1 text-xs">
                      {file.name}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <span className="truncate">{file.name}</span>
                    {file.isMain && (
                      <span className="rounded bg-accent/12 px-1 text-[10px] font-medium text-accent">
                        main
                      </span>
                    )}
                  </div>
                )}

                {!file.isMain && (
                  <button
                    onClick={() => setPendingDelete(file)}
                    className="absolute right-1 top-1 hidden rounded-md bg-surface/90 p-1 text-text-muted shadow-soft transition hover:text-danger group-hover:block"
                    aria-label={`Delete ${file.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {file.kind !== "image" && (
                  <span className="px-2 text-[10px] text-text-muted/60">
                    {formatSize(file.size)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete file"
          message={`"${pendingDelete.name}" will be removed from this project.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
