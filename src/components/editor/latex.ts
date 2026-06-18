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

// Commands offered while typing a backslash. snippet drops the cursor between
// the braces (${}); detail is the short hint shown next to the name. This is a
// working everyday set, not the whole of LaTeX, but enough that typing "\geo"
// finds "\geometry" and so on.
interface Command {
  label: string;
  snippet?: string;
  detail?: string;
}

const commands: Command[] = [
  { label: "\\documentclass", snippet: "\\documentclass{${}}", detail: "document class" },
  { label: "\\usepackage", snippet: "\\usepackage{${}}", detail: "load a package" },
  { label: "\\begin", snippet: "\\begin{${}}", detail: "open an environment" },
  { label: "\\end", snippet: "\\end{${}}", detail: "close an environment" },
  { label: "\\section", snippet: "\\section{${}}", detail: "section" },
  { label: "\\subsection", snippet: "\\subsection{${}}", detail: "subsection" },
  { label: "\\subsubsection", snippet: "\\subsubsection{${}}", detail: "subsubsection" },
  { label: "\\paragraph", snippet: "\\paragraph{${}}", detail: "paragraph heading" },
  { label: "\\chapter", snippet: "\\chapter{${}}", detail: "chapter (book/report)" },
  { label: "\\part", snippet: "\\part{${}}", detail: "part" },
  { label: "\\textbf", snippet: "\\textbf{${}}", detail: "bold" },
  { label: "\\textit", snippet: "\\textit{${}}", detail: "italic" },
  { label: "\\texttt", snippet: "\\texttt{${}}", detail: "monospace" },
  { label: "\\textsc", snippet: "\\textsc{${}}", detail: "small caps" },
  { label: "\\emph", snippet: "\\emph{${}}", detail: "emphasis" },
  { label: "\\underline", snippet: "\\underline{${}}", detail: "underline" },
  { label: "\\textsuperscript", snippet: "\\textsuperscript{${}}", detail: "superscript" },
  { label: "\\item", detail: "list item" },
  { label: "\\item[]", snippet: "\\item[${}] ", detail: "labeled item" },
  { label: "\\label", snippet: "\\label{${}}", detail: "set a label" },
  { label: "\\ref", snippet: "\\ref{${}}", detail: "reference a label" },
  { label: "\\eqref", snippet: "\\eqref{${}}", detail: "reference an equation" },
  { label: "\\pageref", snippet: "\\pageref{${}}", detail: "reference a page" },
  { label: "\\autoref", snippet: "\\autoref{${}}", detail: "typed reference" },
  { label: "\\cite", snippet: "\\cite{${}}", detail: "citation" },
  { label: "\\footnote", snippet: "\\footnote{${}}", detail: "footnote" },
  { label: "\\caption", snippet: "\\caption{${}}", detail: "caption" },
  { label: "\\includegraphics", snippet: "\\includegraphics[width=${}]{${}}", detail: "insert an image" },
  { label: "\\input", snippet: "\\input{${}}", detail: "include another file" },
  { label: "\\include", snippet: "\\include{${}}", detail: "include a file (new page)" },
  { label: "\\href", snippet: "\\href{${}}{${}}", detail: "hyperlink" },
  { label: "\\url", snippet: "\\url{${}}", detail: "URL" },
  { label: "\\frac", snippet: "\\frac{${}}{${}}", detail: "fraction" },
  { label: "\\sqrt", snippet: "\\sqrt{${}}", detail: "square root" },
  { label: "\\sum", snippet: "\\sum_{${}}^{${}}", detail: "summation" },
  { label: "\\prod", snippet: "\\prod_{${}}^{${}}", detail: "product" },
  { label: "\\int", snippet: "\\int_{${}}^{${}}", detail: "integral" },
  { label: "\\lim", snippet: "\\lim_{${}}", detail: "limit" },
  { label: "\\alpha", detail: "greek α" },
  { label: "\\beta", detail: "greek β" },
  { label: "\\gamma", detail: "greek γ" },
  { label: "\\delta", detail: "greek δ" },
  { label: "\\theta", detail: "greek θ" },
  { label: "\\lambda", detail: "greek λ" },
  { label: "\\mu", detail: "greek μ" },
  { label: "\\pi", detail: "greek π" },
  { label: "\\sigma", detail: "greek σ" },
  { label: "\\omega", detail: "greek ω" },
  { label: "\\times", detail: "×" },
  { label: "\\cdot", detail: "·" },
  { label: "\\leq", detail: "≤" },
  { label: "\\geq", detail: "≥" },
  { label: "\\neq", detail: "≠" },
  { label: "\\approx", detail: "≈" },
  { label: "\\infty", detail: "∞" },
  { label: "\\rightarrow", detail: "→" },
  { label: "\\mathbb", snippet: "\\mathbb{${}}", detail: "blackboard bold" },
  { label: "\\mathbf", snippet: "\\mathbf{${}}", detail: "math bold" },
  { label: "\\mathcal", snippet: "\\mathcal{${}}", detail: "calligraphic" },
  { label: "\\text", snippet: "\\text{${}}", detail: "text in math" },
  { label: "\\title", snippet: "\\title{${}}", detail: "title" },
  { label: "\\author", snippet: "\\author{${}}", detail: "author" },
  { label: "\\date", snippet: "\\date{${}}", detail: "date" },
  { label: "\\maketitle", detail: "render the title" },
  { label: "\\tableofcontents", detail: "table of contents" },
  { label: "\\newcommand", snippet: "\\newcommand{${}}{${}}", detail: "define a command" },
  { label: "\\renewcommand", snippet: "\\renewcommand{${}}{${}}", detail: "redefine a command" },
  { label: "\\geometry", snippet: "\\geometry{${}}", detail: "page geometry" },
  { label: "\\textcolor", snippet: "\\textcolor{${}}{${}}", detail: "colored text" },
  { label: "\\hline", detail: "table rule" },
  { label: "\\midrule", detail: "booktabs rule" },
  { label: "\\toprule", detail: "booktabs top rule" },
  { label: "\\bottomrule", detail: "booktabs bottom rule" },
  { label: "\\centering", detail: "center content" },
  { label: "\\newpage", detail: "page break" },
  { label: "\\clearpage", detail: "flush and break" },
  { label: "\\vspace", snippet: "\\vspace{${}}", detail: "vertical space" },
  { label: "\\hspace", snippet: "\\hspace{${}}", detail: "horizontal space" },
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
  "flushleft",
  "flushright",
  "quote",
  "quotation",
  "verbatim",
  "equation",
  "equation*",
  "align",
  "align*",
  "gather",
  "multline",
  "matrix",
  "bmatrix",
  "pmatrix",
  "cases",
  "frame",
  "block",
  "columns",
  "theorem",
  "lemma",
  "proof",
  "minipage",
];

// Common packages suggested after \usepackage{.
const packages = [
  "amsmath",
  "amssymb",
  "amsthm",
  "graphicx",
  "geometry",
  "hyperref",
  "xcolor",
  "babel",
  "inputenc",
  "fontenc",
  "booktabs",
  "array",
  "enumitem",
  "fancyhdr",
  "setspace",
  "microtype",
  "lmodern",
  "listings",
  "tikz",
  "pgfplots",
  "caption",
  "subcaption",
  "float",
  "multicol",
  "titlesec",
  "natbib",
  "biblatex",
  "siunitx",
];

const commandOptions: Completion[] = commands.map((command) =>
  command.snippet
    ? snippetCompletion(command.snippet, {
        label: command.label,
        detail: command.detail,
        type: "keyword",
      })
    : { label: command.label, detail: command.detail, type: "keyword" },
);

const environmentOptions: Completion[] = environments.map((name) => ({
  label: name,
  type: "type",
}));

const packageOptions: Completion[] = packages.map((name) => ({
  label: name,
  type: "class",
}));

// collect things the document defines so we can suggest them back
function collect(context: CompletionContext, pattern: RegExp): Completion[] {
  const text = context.state.doc.toString();
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match[1]) for (const key of match[1].split(",")) found.add(key.trim());
  }
  return [...found].map((label) => ({ label, type: "constant" }));
}

// start of the value being typed inside braces, after the last { or ,
function valueStart(text: string): number {
  return Math.max(text.lastIndexOf("{"), text.lastIndexOf(",")) + 1;
}

function latexCompletions(context: CompletionContext): CompletionResult | null {
  // environment names inside \begin{...} or \end{...}
  const environment = context.matchBefore(/\\(?:begin|end)\{[a-zA-Z*]*$/);
  if (environment) {
    return {
      from: environment.from + environment.text.indexOf("{") + 1,
      options: environmentOptions,
    };
  }

  // package names inside \usepackage[...]{...}
  const usepackage = context.matchBefore(
    /\\usepackage(?:\[[^\]]*\])?\{[a-zA-Z0-9, -]*$/,
  );
  if (usepackage) {
    return {
      from: usepackage.from + valueStart(usepackage.text),
      options: packageOptions,
    };
  }

  // labels defined in the document, inside a \ref-style command
  const reference = context.matchBefore(
    /\\(?:ref|eqref|pageref|autoref|cref|Cref)\{[^}]*$/,
  );
  if (reference) {
    return {
      from: reference.from + reference.text.indexOf("{") + 1,
      options: collect(context, /\\label\{([^}]+)\}/g),
    };
  }

  // citation keys, taken from \bibitem entries in the document
  const citation = context.matchBefore(
    /\\(?:cite|citep|citet|parencite|textcite)\{[^}]*$/,
  );
  if (citation) {
    return {
      from: citation.from + valueStart(citation.text),
      options: collect(context, /\\bibitem(?:\[[^\]]*\])?\{([^}]+)\}/g),
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
