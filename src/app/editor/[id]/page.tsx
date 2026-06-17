"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { EditorView } from "@codemirror/view";
import { SplitPane } from "@/components/editor/SplitPane";
import { CompileLog } from "@/components/editor/CompileLog";
import { FilesPanel } from "@/components/editor/FilesPanel";
import { Toolbar, type SaveState } from "@/components/editor/Toolbar";
import { useCompile } from "@/components/editor/useCompile";
import { getEngine } from "@/lib/engines";
import type { Project } from "@/lib/projects";

// CodeMirror and pdf.js only run in the browser, so load them without SSR
const EditorPane = dynamic(
  () => import("@/components/editor/EditorPane").then((m) => m.EditorPane),
  { ssr: false },
);
const PreviewPane = dynamic(
  () => import("@/components/editor/PreviewPane").then((m) => m.PreviewPane),
  { ssr: false },
);

const SAVE_DEBOUNCE_MS = 800;
const COMPILE_DEBOUNCE_MS = 2000;

export default function EditorPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const [project, setProject] = useState<Project | null>(null);
  const [source, setSource] = useState("");
  const [missing, setMissing] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [showLog, setShowLog] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  // which file is open in the editor; the main file compiles, the rest are
  // \input from it
  const [activeFile, setActiveFile] = useState("");

  const { compile, status, log, durationMs, pdfVersion } = useCompile(id);

  const sourceRef = useRef("");
  const lastSavedRef = useRef("");
  const activeFileRef = useRef("");
  const mainFileRef = useRef("main.tex");
  const editorViewRef = useRef<EditorView | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const compileTimer = useRef<ReturnType<typeof setTimeout>>();

  const save = useCallback(async () => {
    const value = sourceRef.current;
    if (value === lastSavedRef.current) return;
    setSaveState("saving");

    const file = activeFileRef.current;
    if (file && file !== mainFileRef.current) {
      // a secondary file goes through the files API
      await fetch(`/api/projects/${id}/files/${encodeURIComponent(file)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      });
    } else {
      // the main file is the project's source
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: value }),
      });
    }

    lastSavedRef.current = value;
    setSaveState("saved");
  }, [id]);

  // load the project and its source, then compile once so the preview fills in
  useEffect(() => {
    let active = true;
    fetch(`/api/projects/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!active) return;
        const main = getEngine(data.project.engine).mainFileName;
        mainFileRef.current = main;
        setActiveFile(main);
        activeFileRef.current = main;
        setProject(data.project);
        setSource(data.source);
        sourceRef.current = data.source;
        lastSavedRef.current = data.source;
        compile();
      })
      .catch(() => active && setMissing(true));
    return () => {
      active = false;
    };
  }, [id, compile]);

  // open the log automatically when a compile fails or has errors
  useEffect(() => {
    if (status === "error" || status === "warning") setShowLog(true);
  }, [status]);

  // flush pending work when leaving the editor
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      clearTimeout(compileTimer.current);
      void save();
    };
  }, [save]);

  function handleChange(value: string) {
    setSource(value);
    sourceRef.current = value;
    setSaveState("dirty");

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(), SAVE_DEBOUNCE_MS);

    clearTimeout(compileTimer.current);
    compileTimer.current = setTimeout(async () => {
      await save();
      compile();
    }, COMPILE_DEBOUNCE_MS);
  }

  async function manualCompile() {
    clearTimeout(compileTimer.current);
    await save();
    compile();
  }

  // switch which file is open: save the current one, then load the chosen file
  async function openFile(name: string) {
    if (name === activeFileRef.current) return;
    clearTimeout(saveTimer.current);
    clearTimeout(compileTimer.current);
    await save();

    let content = "";
    if (name === mainFileRef.current) {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) content = (await res.json()).source;
    } else {
      const res = await fetch(
        `/api/projects/${id}/files/${encodeURIComponent(name)}`,
      );
      if (res.ok) content = await res.text();
    }

    setActiveFile(name);
    activeFileRef.current = name;
    setSource(content);
    sourceRef.current = content;
    lastSavedRef.current = content;
    setSaveState("saved");
    editorViewRef.current?.focus();
  }

  // the open file was deleted: fall back to main without re-saving the deleted one
  function handleFileDeleted() {
    lastSavedRef.current = sourceRef.current;
    openFile(mainFileRef.current);
  }

  // drop an \includegraphics line for an uploaded image at the cursor
  function insertImage(name: string) {
    const view = editorViewRef.current;
    if (!view) return;
    view.dispatch(
      view.state.replaceSelection(`\\includegraphics[width=\\linewidth]{${name}}`),
    );
    view.focus();
  }

  async function rename(name: string) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) setProject(await res.json());
  }

  if (missing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-text-muted">This project doesn&apos;t exist.</p>
        <Link href="/" className="text-sm font-medium text-accent">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Toolbar
        project={project}
        saveState={saveState}
        status={status}
        durationMs={durationMs}
        hasPdf={pdfVersion > 0}
        onCompile={manualCompile}
        onToggleLog={() => setShowLog((open) => !open)}
        onToggleFiles={() => setShowFiles((open) => !open)}
        onRename={rename}
      />

      <div className="flex min-h-0 flex-1">
        {showFiles && (
          <FilesPanel
            projectId={id}
            activeFile={activeFile}
            onInsertImage={insertImage}
            onOpenFile={openFile}
            onFileDeleted={handleFileDeleted}
          />
        )}

        <div className="min-w-0 flex-1">
          <SplitPane
            left={
              <div className="flex h-full flex-col">
                <div className="min-h-0 flex-1">
                  <EditorPane
                    value={source}
                    onChange={handleChange}
                    onReady={(view) => {
                      editorViewRef.current = view;
                    }}
                  />
                </div>
                {showLog && (
                  <CompileLog
                    log={log}
                    status={status}
                    onClose={() => setShowLog(false)}
                  />
                )}
              </div>
            }
            right={
              <PreviewPane
                projectId={id}
                version={pdfVersion}
                documentStatus={status}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
