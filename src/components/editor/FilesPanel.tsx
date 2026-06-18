"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Download, FilePlus, FileText, Trash2, Upload } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ProjectFile {
  name: string;
  size: number;
  kind: "tex" | "image" | "pdf" | "other";
  isMain: boolean;
}

interface FilesPanelProps {
  projectId: string;
  activeFile: string;
  onInsertImage: (name: string) => void;
  onOpenFile: (name: string) => void;
  onFileDeleted: (name: string) => void;
}

const TEXT_FILE = /\.(tex|txt|bib|cls|sty)$/i;
const INSERTABLE = /\.(png|jpe?g|gif|webp|pdf)$/i;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesPanel({
  projectId,
  activeFile,
  onInsertImage,
  onOpenFile,
  onFileDeleted,
}: FilesPanelProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProjectFile | null>(null);
  const [newName, setNewName] = useState<string | null>(null);
  const uploadInput = useRef<HTMLInputElement>(null);

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

  async function createFile() {
    let name = (newName ?? "").trim();
    setNewName(null);
    if (!name) return;
    if (!/\.[a-z0-9]+$/i.test(name)) name += ".tex"; // default to a .tex file
    await fetch(`/api/projects/${projectId}/files/${encodeURIComponent(name)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "" }),
    });
    await refresh();
    onOpenFile(name);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { name } = pendingDelete;
    setPendingDelete(null);
    await fetch(`/api/projects/${projectId}/files/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    await refresh();
    if (name === activeFile) onFileDeleted(name);
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setNewName("")}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-accent transition hover:bg-accent/10"
            title="New file"
          >
            <FilePlus className="h-3.5 w-3.5" />
            New
          </button>
          <button
            onClick={() => uploadInput.current?.click()}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-accent transition hover:bg-accent/10"
            title="Upload images or PDFs"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </button>
        </div>
        <input
          ref={uploadInput}
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
        {newName !== null && (
          <input
            autoFocus
            value={newName}
            placeholder="name.tex"
            onChange={(event) => setNewName(event.target.value)}
            onBlur={createFile}
            onKeyDown={(event) => {
              if (event.key === "Enter") createFile();
              if (event.key === "Escape") setNewName(null);
            }}
            className="mb-2 w-full rounded-md border border-accent bg-surface px-2 py-1 text-xs focus:outline-none"
          />
        )}

        {uploading && (
          <p className="px-1 py-2 text-xs text-text-muted">Uploading...</p>
        )}

        {files.length === 0 && !uploading && newName === null ? (
          <p className="px-1 py-6 text-center text-xs text-text-muted">
            Drop images here or use Upload. Use New to add a .tex file.
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
                ) : TEXT_FILE.test(file.name) ? (
                  <button
                    onClick={() => onOpenFile(file.name)}
                    className={clsx(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-surface-2",
                      file.name === activeFile && "bg-accent/12 text-accent",
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    {file.isMain && (
                      <span className="rounded bg-accent/15 px-1 text-[10px] font-medium text-accent">
                        main
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      INSERTABLE.test(file.name) && onInsertImage(file.name)
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition hover:bg-surface-2"
                    title={
                      INSERTABLE.test(file.name) ? `Insert ${file.name}` : undefined
                    }
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                    <span className="truncate">{file.name}</span>
                    <span className="ml-auto text-[10px] text-text-muted/60">
                      {formatSize(file.size)}
                    </span>
                  </button>
                )}

                <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
                  <a
                    href={`/api/projects/${projectId}/files/${encodeURIComponent(file.name)}`}
                    download={file.name}
                    onClick={(event) => event.stopPropagation()}
                    className="rounded-md bg-surface/90 p-1 text-text-muted shadow-soft transition hover:text-text"
                    aria-label={`Download ${file.name}`}
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  {!file.isMain && (
                    <button
                      onClick={() => setPendingDelete(file)}
                      className="rounded-md bg-surface/90 p-1 text-text-muted shadow-soft transition hover:text-danger"
                      aria-label={`Delete ${file.name}`}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
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
