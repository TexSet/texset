import type { EngineId } from "./engines";

// Starter documents offered on the dashboard. Each one is a complete, ready to
// compile source so a new project builds a PDF on the very first try. They stick
// to packages bundled in the Docker image's TeX Live install.

export interface Template {
  id: string;
  name: string;
  description: string;
  engine: EngineId;
  source: string;
}

const ARTICLE = `\\documentclass[11pt]{article}

\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{Your Title Here}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
A short summary of what this document is about.
\\end{abstract}

\\section{Introduction}
Start writing here. You can write math inline, like $E = mc^2$, or as a
display:
\\[
  \\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}.
\\]

\\section{Methods}
Use sections to give the document structure.

\\section{Conclusion}
Wrap things up.

\\end{document}
`;

const LETTER = `\\documentclass[11pt]{letter}
\\usepackage[margin=1in]{geometry}

\\signature{Your Name}
\\address{Your Name \\\\ Street Address \\\\ City, Country}

\\begin{document}

\\begin{letter}{Recipient Name \\\\ Company \\\\ Address}

\\opening{Dear Recipient,}

Write the body of your letter here. Keep it clear and to the point, one idea
per paragraph.

\\closing{Sincerely,}

\\end{letter}

\\end{document}
`;

const RESUME = `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\titleformat{\\section}{\\large\\bfseries}{}{0pt}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{6pt}

% one experience or education line: title, dates, place, location
\\newcommand{\\entry}[4]{%
  \\textbf{#1} \\hfill #2 \\\\
  \\textit{#3} \\hfill #4 \\\\[4pt]
}

\\begin{document}

{\\huge\\bfseries Your Name}\\\\[4pt]
City, Country \\quad | \\quad you@example.com \\quad | \\quad +00 000 000 000

\\section{Experience}
\\entry{Job Title}{2022 -- Present}{Company}{City}
\\begin{itemize}[leftmargin=*, nosep]
  \\item What you did and the impact it had.
  \\item Another accomplishment, ideally with a concrete result.
\\end{itemize}

\\section{Education}
\\entry{Degree}{2018 -- 2022}{University}{City}

\\section{Skills}
List your key skills here, separated by commas.

\\end{document}
`;

const PRESENTATION = `\\documentclass{beamer}

\\usetheme{Madrid}
\\usecolortheme{seahorse}

\\title{Presentation Title}
\\subtitle{An optional subtitle}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}{Outline}
  \\tableofcontents
\\end{frame}

\\section{Introduction}

\\begin{frame}{Introduction}
  \\begin{itemize}
    \\item First point
    \\item Second point
    \\item Third point
  \\end{itemize}
\\end{frame}

\\section{Details}

\\begin{frame}{A Slide with Math}
  The quadratic formula:
  \\[
    x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
  \\]
\\end{frame}

\\begin{frame}{Conclusion}
  \\begin{block}{Takeaway}
    Summarize the key message here.
  \\end{block}
\\end{frame}

\\end{document}
`;

export const templates: Template[] = [
  {
    id: "article",
    name: "Article",
    description: "A clean starting point for papers and reports.",
    engine: "latex",
    source: ARTICLE,
  },
  {
    id: "letter",
    name: "Letter",
    description: "A formal letter with sender and recipient.",
    engine: "latex",
    source: LETTER,
  },
  {
    id: "resume",
    name: "Résumé",
    description: "A simple one-page résumé layout.",
    engine: "latex",
    source: RESUME,
  },
  {
    id: "presentation",
    name: "Presentation",
    description: "A Beamer slide deck with a title and sections.",
    engine: "latex",
    source: PRESENTATION,
  },
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
