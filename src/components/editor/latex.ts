import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import {
  autocompletion,
  snippetCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

// Common commands offered while typing a backslash. The ones with a snippet
// drop the cursor between the braces (${} is the cursor stop) so you can keep
// typing the argument right away.
const commands: { label: string; snippet?: string }[] = [
  { label: "\\documentclass", snippet: "\\documentclass{${}}" },
  { label: "\\usepackage", snippet: "\\usepackage{${}}" },
  { label: "\\begin", snippet: "\\begin{${}}" },
  { label: "\\end", snippet: "\\end{${}}" },
  { label: "\\section", snippet: "\\section{${}}" },
  { label: "\\subsection", snippet: "\\subsection{${}}" },
  { label: "\\subsubsection", snippet: "\\subsubsection{${}}" },
  { label: "\\paragraph", snippet: "\\paragraph{${}}" },
  { label: "\\textbf", snippet: "\\textbf{${}}" },
  { label: "\\textit", snippet: "\\textit{${}}" },
  { label: "\\texttt", snippet: "\\texttt{${}}" },
  { label: "\\emph", snippet: "\\emph{${}}" },
  { label: "\\underline", snippet: "\\underline{${}}" },
  { label: "\\item" },
  { label: "\\label", snippet: "\\label{${}}" },
  { label: "\\ref", snippet: "\\ref{${}}" },
  { label: "\\eqref", snippet: "\\eqref{${}}" },
  { label: "\\cite", snippet: "\\cite{${}}" },
  { label: "\\footnote", snippet: "\\footnote{${}}" },
  { label: "\\caption", snippet: "\\caption{${}}" },
  { label: "\\includegraphics", snippet: "\\includegraphics[width=${}]{${}}" },
  { label: "\\frac", snippet: "\\frac{${}}{${}}" },
  { label: "\\sqrt", snippet: "\\sqrt{${}}" },
  { label: "\\sum", snippet: "\\sum_{${}}^{${}}" },
  { label: "\\int", snippet: "\\int_{${}}^{${}}" },
  { label: "\\title", snippet: "\\title{${}}" },
  { label: "\\author", snippet: "\\author{${}}" },
  { label: "\\date", snippet: "\\date{${}}" },
  { label: "\\maketitle" },
  { label: "\\newcommand", snippet: "\\newcommand{${}}{${}}" },
  { label: "\\hline" },
  { label: "\\newpage" },
];

// Environment names suggested right after \begin{ or \end{.
const environments = [
  "document",
  "abstract",
  "itemize",
  "enumerate",
  "description",
  "figure",
  "table",
  "tabular",
  "center",
  "quote",
  "verbatim",
  "equation",
  "align",
  "gather",
  "matrix",
  "bmatrix",
  "pmatrix",
  "cases",
  "frame",
  "block",
  "theorem",
  "proof",
];

const commandOptions: Completion[] = commands.map((command) =>
  command.snippet
    ? snippetCompletion(command.snippet, {
        label: command.label,
        type: "keyword",
      })
    : { label: command.label, type: "keyword" },
);

const environmentOptions: Completion[] = environments.map((name) => ({
  label: name,
  type: "type",
}));

function latexCompletions(context: CompletionContext): CompletionResult | null {
  // inside \begin{...} or \end{...}, complete the environment name
  const inEnvironment = context.matchBefore(/\\(?:begin|end)\{[a-zA-Z*]*$/);
  if (inEnvironment) {
    const braceAt = inEnvironment.text.indexOf("{");
    return {
      from: inEnvironment.from + braceAt + 1,
      options: environmentOptions,
    };
  }

  // a backslash followed by letters: complete the command
  const command = context.matchBefore(/\\[a-zA-Z]*/);
  if (command && (command.from < command.to || context.explicit)) {
    return { from: command.from, options: commandOptions };
  }

  return null;
}

// matches the rest of the app: mono font, accent-colored cursor and selection
const theme = EditorView.theme({
  "&": { height: "100%", fontSize: "14px", backgroundColor: "transparent" },
  ".cm-scroller": { fontFamily: "var(--font-mono)" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    color: "rgb(var(--color-text-muted))",
  },
  ".cm-activeLine": { backgroundColor: "rgb(var(--color-surface-2) / 0.6)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "rgb(var(--color-accent) / 0.2)",
  },
  ".cm-cursor": { borderLeftColor: "rgb(var(--color-accent))" },
  "&.cm-focused": { outline: "none" },
});

export const latexExtensions: Extension[] = [
  StreamLanguage.define(stex),
  theme,
  autocompletion({ override: [latexCompletions] }),
];
