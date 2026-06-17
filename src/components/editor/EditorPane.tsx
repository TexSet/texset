"use client";

import CodeMirror from "@uiw/react-codemirror";
import type { EditorView } from "@codemirror/view";
import { latexExtensions } from "./latex";

interface EditorPaneProps {
  value: string;
  onChange: (value: string) => void;
  // hands the underlying CodeMirror view up so the page can insert text (e.g.
  // an \includegraphics line) at the cursor
  onReady?: (view: EditorView) => void;
}

export function EditorPane({ value, onChange, onReady }: EditorPaneProps) {
  return (
    <div className="h-full overflow-hidden bg-surface">
      <CodeMirror
        value={value}
        onChange={onChange}
        onCreateEditor={(view) => onReady?.(view)}
        height="100%"
        theme="light"
        extensions={latexExtensions}
        // we provide our own LaTeX autocomplete, so turn off the default one
        basicSetup={{ autocompletion: false }}
        className="h-full"
      />
    </div>
  );
}
