"use client";

import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Sigma,
  Underline,
  type LucideIcon,
} from "lucide-react";
import type { EditorView } from "@codemirror/view";

// wrap the current selection (or drop the cursor between the braces if nothing
// is selected)
function wrap(view: EditorView, before: string, after: string) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  view.dispatch({
    changes: { from, to, insert: before + selected + after },
    selection: { anchor: from + before.length + selected.length },
  });
  view.focus();
}

// drop a block of text where the cursor is, e.g. a list environment
function insertBlock(view: EditorView, text: string) {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  view.focus();
}

const ITEMIZE = "\\begin{itemize}\n  \\item \n\\end{itemize}\n";
const ENUMERATE = "\\begin{enumerate}\n  \\item \n\\end{enumerate}\n";

interface Action {
  icon: LucideIcon;
  title: string;
  run: (view: EditorView) => void;
}

const groups: Action[][] = [
  [
    { icon: Bold, title: "Bold", run: (v) => wrap(v, "\\textbf{", "}") },
    { icon: Italic, title: "Italic", run: (v) => wrap(v, "\\textit{", "}") },
    {
      icon: Underline,
      title: "Underline",
      run: (v) => wrap(v, "\\underline{", "}"),
    },
  ],
  [
    {
      icon: Heading1,
      title: "Section",
      run: (v) => wrap(v, "\\section{", "}"),
    },
    {
      icon: Heading2,
      title: "Subsection",
      run: (v) => wrap(v, "\\subsection{", "}"),
    },
  ],
  [
    { icon: List, title: "Bulleted list", run: (v) => insertBlock(v, ITEMIZE) },
    {
      icon: ListOrdered,
      title: "Numbered list",
      run: (v) => insertBlock(v, ENUMERATE),
    },
  ],
  [{ icon: Sigma, title: "Inline math", run: (v) => wrap(v, "$", "$") }],
];

export function FormatBar({ view }: { view: EditorView | null }) {
  return (
    <div className="flex items-center gap-1 border-b border-border bg-surface px-2 py-1">
      {groups.map((group, index) => (
        <div key={index} className="flex items-center gap-0.5">
          {index > 0 && <span className="mx-1 h-4 w-px bg-border" />}
          {group.map((action) => (
            <button
              key={action.title}
              title={action.title}
              aria-label={action.title}
              disabled={!view}
              onClick={() => view && action.run(view)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-2 hover:text-text disabled:opacity-40"
            >
              <action.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
