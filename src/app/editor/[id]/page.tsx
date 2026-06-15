"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Play,
  Download,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { EditorPaneRef } from "@/components/editor/EditorPane";
import type { PreviewPaneRef } from "@/components/editor/PreviewPane";

const EditorPane = dynamic(() => import("@/components/editor/EditorPane"), {
  ssr: false,
});
const PreviewPane = dynamic(() => import("@/components/editor/PreviewPane"), {
  ssr: false,
});

type CompileStatus = "idle" | "compiling" | "success" | "error";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [projectName, setProjectName] = useState("Loading...");
  const [source, setSource] = useState("");
  const [compileStatus, setCompileStatus] = useState<CompileStatus>("idle");
  const [compileLog, setCompileLog] = useState("");
  const [compileDuration, setCompileDuration] = useState<number | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const sourceRef = useRef(source);
  
  const editorRef = useRef<EditorPaneRef>(null);
  const previewRef = useRef<PreviewPaneRef>(null);

  // keep ref in sync for the debounce callback
  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  // load project on mount
  useEffect(() => {
    async function load() {
      const [projectRes, filesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/files`),
      ]);

      if (!projectRes.ok) {
        router.push("/");
        return;
      }

      const project = await projectRes.json();
      setProjectName(project.name);

      if (filesRes.ok) {
        const data = await filesRes.json();
        setSource(data.source);
      }
    }

    load();
  }, [projectId, router]);

  // save source to disk
  const saveSource = useCallback(
    async (content: string) => {
      setSaving(true);
      await fetch(`/api/projects/${projectId}/files`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: content }),
      });
      setSaving(false);
    },
    [projectId]
  );

  // compile the project via SSE
  const compile = useCallback(async () => {
    // save first
    await saveSource(sourceRef.current);

    setCompileStatus("compiling");
    setCompileLog("");
    setCompileDuration(null);

    try {
      const res = await fetch(`/api/compile/${projectId}`, { method: "POST" });

      if (!res.ok || !res.body) {
        setCompileStatus("error");
        setCompileLog("Failed to start compilation");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullLog = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "log") {
              fullLog += data.content;
              setCompileLog(fullLog);
            } else if (data.type === "done") {
              setCompileStatus(data.success ? "success" : "error");
              setCompileDuration(data.duration);
              if (data.success) {
                // cache-bust the pdf
                setPdfUrl(`/api/output/${projectId}?t=${Date.now()}`);
              }
            } else if (data.type === "error") {
              setCompileStatus("error");
              setCompileLog(fullLog + "\n" + data.message);
            }
          } catch {
            // malformed line, skip
          }
        }
      }
    } catch {
      setCompileStatus("error");
      setCompileLog("Connection lost during compilation");
    }
  }, [projectId, saveSource]);

  // handle source changes with debounce
  function handleSourceChange(value: string) {
    setSource(value);

    // clear previous timer
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // auto-compile after 2s
    debounceRef.current = setTimeout(() => {
      compile();
    }, 2000);
  }

  // export pdf download
  function exportPdf() {
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = `${projectName}.pdf`;
      a.click();
    }
  }

  // Forward search (Code -> PDF)
  const handleEditorSync = useCallback(async (line: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/synctex?line=${line}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.point && previewRef.current) {
          const { page, x, y, w, h } = data.point;
          previewRef.current.scrollToPoint(page, x, y, w, h);
        }
      }
    } catch (err) {
      console.error("Forward search failed", err);
    }
  }, [projectId]);

  // Inverse search (PDF -> Code)
  const handlePreviewSync = useCallback(async (page: number, x: number, y: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/synctex?page=${page}&x=${x}&y=${y}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.match && editorRef.current) {
          editorRef.current.scrollToLine(data.match.line);
        }
      }
    } catch (err) {
      console.error("Inverse search failed", err);
    }
  }, [projectId]);

  const statusIcon = {
    idle: null,
    compiling: <Loader2 size={14} className="animate-spin text-accent" />,
    success: <Check size={14} className="text-success" />,
    error: <AlertCircle size={14} className="text-error" />,
  };

  const statusText = {
    idle: "",
    compiling: "Compiling...",
    success: compileDuration ? `Compiled in ${(compileDuration / 1000).toFixed(1)}s` : "Compiled",
    error: "Compilation failed",
  };

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      {/* toolbar */}
      <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-surface-raised shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-1.5 rounded-md hover:bg-surface-overlay transition-colors"
          >
            <ArrowLeft size={16} className="text-text-secondary" />
          </button>
          <Image src="/TexSet.svg" alt="TexSet" width={22} height={22} />
          <span className="text-sm font-medium text-text-primary truncate max-w-[200px]">
            {projectName}
          </span>
          {saving && (
            <span className="text-xs text-text-muted animate-fade-in">Saving...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={Play}
            variant="primary"
            size="sm"
            onClick={compile}
            loading={compileStatus === "compiling"}
          >
            Compile
          </Button>
          <Button
            icon={Download}
            variant="ghost"
            size="sm"
            onClick={exportPdf}
            disabled={!pdfUrl}
          >
            Export
          </Button>
        </div>
      </header>

      {/* editor + preview */}
      <div className="flex-1 flex min-h-0">
        {/* editor pane */}
        <div className="w-1/2 flex flex-col border-r border-border min-h-0 bg-surface">
          <EditorPane
            ref={editorRef}
            value={source}
            onChange={handleSourceChange}
            onCursorChange={(line, col) => setCursorPos({ line, col })}
            onSyncRequest={handleEditorSync}
          />
        </div>

        {/* preview pane */}
        <div className="w-1/2 flex flex-col bg-surface-overlay min-h-0">
          <PreviewPane
            ref={previewRef}
            pdfUrl={pdfUrl}
            compiling={compileStatus === "compiling"}
            onSyncRequest={handlePreviewSync}
          />
        </div>
      </div>

      {/* status bar */}
      <footer className="flex items-center justify-between px-4 h-7 border-t border-border
                         bg-surface-raised text-xs text-text-muted shrink-0">
        <div className="flex items-center gap-2">
          {statusIcon[compileStatus]}
          <span>{statusText[compileStatus]}</span>
          {compileLog && (
            <button
              onClick={() => setShowLog(!showLog)}
              className="flex items-center gap-0.5 hover:text-text-secondary transition-colors"
            >
              Log
              {showLog ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>xelatex</span>
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
        </div>
      </footer>

      {/* compile log panel */}
      {showLog && compileLog && (
        <div className="max-h-48 overflow-auto border-t border-border bg-surface-raised px-4 py-2
                        font-mono text-xs text-text-secondary animate-slide-up shrink-0">
          <pre className="whitespace-pre-wrap">{compileLog}</pre>
        </div>
      )}
    </div>
  );
}
