import { nanoid } from "nanoid";
import fs from "fs";
import { getDb } from "./db";
import { getMainTexPath, getProjectDir } from "./storage";

export interface Project {
  id: string;
  name: string;
  template: string | null;
  created_at: number;
  updated_at: number;
  last_opened: number | null;
}

const BLANK_TEMPLATE = `\\documentclass[12pt]{article}
\\usepackage{fontspec}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\title{Untitled Document}
\\author{}
\\date{\\today}

\\begin{document}
\\maketitle

Write something here.

\\end{document}
`;

export function createProject(name: string, template?: string): Project {
  const db = getDb();
  const id = nanoid(12);
  const now = Date.now();

  db.prepare(
    `INSERT INTO projects (id, name, template, created_at, updated_at, last_opened)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, name, template || null, now, now, now);

  // write the initial .tex file
  const texPath = getMainTexPath(id);
  const content = template ? getTemplateContent(template) : BLANK_TEMPLATE;
  fs.writeFileSync(texPath, content, "utf-8");

  return { id, name, template: template || null, created_at: now, updated_at: now, last_opened: now };
}

export function listProjects(): Project[] {
  const db = getDb();
  return db.prepare("SELECT * FROM projects ORDER BY last_opened DESC").all() as Project[];
}

export function getProject(id: string): Project | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Project | undefined;
  return row || null;
}

export function updateProjectTimestamp(id: string): void {
  const db = getDb();
  db.prepare("UPDATE projects SET last_opened = ?, updated_at = ? WHERE id = ?").run(
    Date.now(),
    Date.now(),
    id
  );
}

export function renameProject(id: string, name: string): void {
  const db = getDb();
  db.prepare("UPDATE projects SET name = ?, updated_at = ? WHERE id = ?").run(name, Date.now(), id);
}

export function deleteProject(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);

  // remove files from disk
  const dir = getProjectDir(id);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function readProjectSource(id: string): string {
  const texPath = getMainTexPath(id);
  if (!fs.existsSync(texPath)) return "";
  return fs.readFileSync(texPath, "utf-8");
}

export function writeProjectSource(id: string, content: string): void {
  const texPath = getMainTexPath(id);
  fs.writeFileSync(texPath, content, "utf-8");

  const db = getDb();
  db.prepare("UPDATE projects SET updated_at = ? WHERE id = ?").run(Date.now(), id);
}

// template content by key
function getTemplateContent(template: string): string {
  const templates: Record<string, string> = {
    article: `\\documentclass[12pt]{article}
\\usepackage{fontspec}
\\usepackage{geometry}
\\usepackage{amsmath}
\\usepackage{hyperref}
\\geometry{a4paper, margin=1in}

\\title{Article Title}
\\author{Author Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Your abstract goes here.
\\end{abstract}

\\section{Introduction}

Start writing your article here.

\\section{Methods}

\\section{Results}

\\section{Conclusion}

\\end{document}
`,
    thesis: `\\documentclass[12pt]{report}
\\usepackage{fontspec}
\\usepackage{geometry}
\\usepackage{setspace}
\\usepackage{amsmath}
\\usepackage{hyperref}
\\usepackage{graphicx}
\\geometry{a4paper, margin=1in}
\\onehalfspacing

\\title{Thesis Title}
\\author{Author Name}
\\date{\\today}

\\begin{document}
\\maketitle
\\tableofcontents

\\chapter{Introduction}

Background and motivation for your research.

\\chapter{Literature Review}

\\chapter{Methodology}

\\chapter{Results}

\\chapter{Discussion}

\\chapter{Conclusion}

\\bibliographystyle{plain}

\\end{document}
`,
    beamer: `\\documentclass{beamer}
\\usepackage{fontspec}
\\usetheme{metropolis}

\\title{Presentation Title}
\\author{Author Name}
\\institute{Institution}
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
Your content here.
\\end{frame}

\\section{Main Content}

\\begin{frame}{Slide Title}
\\begin{itemize}
  \\item First point
  \\item Second point
  \\item Third point
\\end{itemize}
\\end{frame}

\\section{Conclusion}

\\begin{frame}{Conclusion}
Summary of your presentation.
\\end{frame}

\\end{document}
`,
    cv: `\\documentclass[11pt,a4paper]{article}
\\usepackage{fontspec}
\\usepackage{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\geometry{margin=0.75in}

\\pagestyle{empty}

\\begin{document}

{\\centering
{\\LARGE\\bfseries Your Name}\\\\[4pt]
your.email@example.com \\textbar{} +1 (555) 000-0000 \\textbar{} City, State\\\\[2pt]
\\url{https://github.com/yourusername}\\\\
}

\\vspace{12pt}
\\hrule
\\vspace{8pt}

\\section*{Education}
\\textbf{University Name} \\hfill 2020 -- 2024\\\\
B.S. in Computer Science \\hfill GPA: 3.8/4.0

\\section*{Experience}
\\textbf{Job Title} \\hfill Company Name \\hfill 2024 -- Present
\\begin{itemize}[nosep, leftmargin=*]
  \\item Accomplishment or responsibility
  \\item Another accomplishment
\\end{itemize}

\\section*{Skills}
\\textbf{Languages}: Python, TypeScript, Rust\\\\
\\textbf{Tools}: Docker, Git, Linux

\\end{document}
`,
    letter: `\\documentclass[12pt]{letter}
\\usepackage{fontspec}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\signature{Your Name}
\\address{Your Address\\\\City, State ZIP}

\\begin{document}

\\begin{letter}{Recipient Name\\\\Recipient Address\\\\City, State ZIP}

\\opening{Dear Recipient,}

Body of your letter goes here.

\\closing{Sincerely,}

\\end{letter}
\\end{document}
`,
  };

  return templates[template] || BLANK_TEMPLATE;
}
