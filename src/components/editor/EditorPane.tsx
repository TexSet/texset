"use client";

import CodeMirror from "@uiw/react-codemirror";
import { latexExtensions } from "./latex";

interface EditorPaneProps {
  value: string;
  onChange: (value: string) => void;
}

export function EditorPane({ value, onChange }: EditorPaneProps) {
  return (
    <div className="h-full overflow-hidden bg-surface">
      <CodeMirror
        value={value}
        onChange={onChange}
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
