# TexSet

A fast, local-first LaTeX editor. Write LaTeX on the left, watch the PDF build on
the right. Everything runs on your machine: no accounts, no external APIs, no
cloud. Your documents are just files in a folder you control.

> **In active development.** TexSet is usable today but still growing, and not
> everything is polished yet. Bug reports, ideas, and feedback are very welcome —
> open an issue and let me know what works and what doesn't.

It's built to be modular. Today it compiles LaTeX with xelatex (driven by
latexmk); the editor and compiler sit behind an engine abstraction so Typst
support can drop in later. The accent color follows the document type (green for
LaTeX) so you always know what you're editing.

## What you can do

- **Editor** — CodeMirror 6 with LaTeX highlighting, a formatting toolbar (bold,
  italic, headings, lists, math), and autocomplete for commands, environments,
  packages, and your own `\ref`/`\cite`/`\label`.
- **Live preview** — the PDF rebuilds as you type (2s debounce) with a manual
  compile button, pinch-to-zoom, and zoom controls. Errors are listed and click
  to jump to the offending line.
- **Real LaTeX** — latexmk runs bibtex/biber and makeindex and reruns as needed,
  so citations, bibliographies, indexes, and cross-references resolve. The Docker
  image ships the full TeX Live plus common fonts.
- **Multiple files** — add and edit several `.tex` files, with `\input`/`\include`
  from the main one.
- **Images & assets** — upload images (drag and drop), preview them, insert
  `\includegraphics`, and rename or delete files.
- **Projects** — a gallery with Word-like previews, pin to top, rename, and
  delete with confirmation.
- **Templates** — article, letter, résumé, and a Beamer presentation, each with a
  preview.
- **Import / export** — open a `.tex` as a new project; download your source or
  any asset.
- **Dark mode** — a light/dark toggle that's remembered between visits.
- **Keyboard shortcuts** — save (`Ctrl/Cmd+S`) and compile (`Ctrl/Cmd+Enter`).

## Running it

### Docker (recommended)

Bundles Node and a full TeX Live, so you don't set up a LaTeX toolchain yourself.

```bash
git clone https://github.com/texset/texset.git
cd texset
docker compose up --build
```

Open http://localhost:7474. Your projects appear in `./projects` on your machine.
The first build is large because it installs TeX Live; later builds are fast.
See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) for configuration.

### Desktop app

A desktop build (Electron) is in progress so the app can be installed from the
Microsoft Store and run without Docker. It bundles a small TeX distribution
(TinyTeX) and falls back to a system install if you already have one. See
[desktop/README.md](desktop/README.md).

### Local development

You'll need Node.js 20+, pnpm, and — to actually compile — a LaTeX engine on your
`PATH` (TeX Live or MiKTeX). Without one, the app runs and shows a banner
explaining how to install it.

```bash
pnpm install
pnpm dev
```

The dev server runs on http://localhost:7474.

## How it's built

| Layer       | Choice                          |
| ----------- | ------------------------------- |
| Framework   | Next.js 14 (App Router)         |
| Language    | TypeScript, strict mode         |
| Styling     | Tailwind CSS v3                 |
| Editor      | CodeMirror 6                    |
| PDF viewer  | pdf.js                          |
| Index       | SQLite (better-sqlite3)         |
| TeX engine  | latexmk + xelatex (TeX Live)    |
| Container   | Docker, node:20-bookworm-slim   |

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Contributing & feedback

Contributions and feedback are welcome — see
[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the branching and pull request
workflow, and the issue templates for bug reports and feature requests.

## License

[MIT](LICENSE)
