"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { latex } from "codemirror-lang-latex";
import { EditorState } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Custom highlighting styles matching TexSet variables
const texsetHighlightStyle = HighlightStyle.define([
  { tag: t.comment, color: "hsl(var(--text-muted))", fontStyle: "italic" },
  { tag: t.keyword, color: "hsl(var(--accent))", fontWeight: "bold" },
  { tag: t.operator, color: "hsl(var(--text-secondary))" },
  { tag: t.string, color: "hsl(var(--success))" },
  { tag: t.number, color: "hsl(var(--warning))" },
  { tag: t.className, color: "hsl(var(--accent))" },
  { tag: t.macroName, color: "hsl(var(--accent))", fontWeight: "600" },
  { tag: t.special(t.string), color: "hsl(var(--success))" },
  { tag: t.meta, color: "hsl(var(--text-secondary))" },
]);

// Custom editor theme using CSS variables
const texsetEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "hsl(var(--surface))",
    color: "hsl(var(--text-primary))",
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "var(--font-mono)",
    lineHeight: "1.6",
  },
  ".cm-gutters": {
    backgroundColor: "hsl(var(--surface-raised))",
    color: "hsl(var(--text-muted))",
    borderRight: "1px solid hsl(var(--border))",
  },
  ".cm-gutterElement": {
    paddingLeft: "12px",
    paddingRight: "12px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "hsl(var(--surface-overlay))",
    color: "hsl(var(--text-secondary))",
    fontWeight: "bold",
  },
  ".cm-activeLine": {
    backgroundColor: "hsl(var(--surface-overlay) / 0.3)",
  },
  ".cm-cursor": {
    borderLeft: "2px solid hsl(var(--accent))",
  },
  "&.cm-focused .cm-cursor": {
    borderLeft: "2px solid hsl(var(--accent))",
  },
  ".cm-selectionBackground": {
    backgroundColor: "hsl(var(--accent) / 0.15) !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    backgroundColor: "hsl(var(--accent) / 0.15) !important",
  },
  ".cm-panels": {
    backgroundColor: "hsl(var(--surface-raised))",
    borderTop: "1px solid hsl(var(--border))",
  },
});

interface EditorPaneProps {
  value: string;
  onChange: (value: string) => void;
  onCursorChange?: (line: number, col: number) => void;
}

export default function EditorPane({ value, onChange, onCursorChange }: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onCursorChangeRef = useRef(onCursorChange);

  // Sync callbacks to avoid recreation of the state listener
  useEffect(() => {
    onChangeRef.current = onChange;
    onCursorChangeRef.current = onCursorChange;
  }, [onChange, onCursorChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Listener to bubble up document and cursor changes
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
      if (update.selectionSet && onCursorChangeRef.current) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        onCursorChangeRef.current(line.number, pos - line.from + 1);
      }
    });

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        latex(),
        syntaxHighlighting(texsetHighlightStyle),
        texsetEditorTheme,
        updateListener,
        keymap.of([indentWithTab]),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update CodeMirror content if the prop value changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full min-h-0 border-none focus:outline-none"
    />
  );
}
