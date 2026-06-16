# Architecture

A tour of how TexSet is put together and why. The guiding ideas are: keep
everything local, keep it fast, and keep the door open for more than just LaTeX.

## The big picture

TexSet is a single Next.js application. The browser runs the editor and PDF
viewer; the server compiles documents and stores files. There's no separate
backend service and no message queue. Compilation is just a child process the
server spawns when you ask for a build.

```
browser (CodeMirror + pdf.js)
        |
        |  fetch / SSE
        v
Next.js server (App Router, API routes)
        |
        +-- SQLite index (project metadata)
        +-- filesystem (sources + compiled PDFs)
        +-- xelatex child process (compilation)
```

## Where data lives

Everything sits under one data directory (`TEXSET_DATA_DIR`, defaults to
`./projects`):

- `texset.db` is a SQLite database holding the project index: names, templates,
  timestamps. It's metadata only, so it stays small and quick.
- Each project gets its own folder named by id, containing the `.tex` sources
  and an `output/` directory for the compiled PDF, logs, and synctex data.

Keeping sources on the plain filesystem means your work is portable and easy to
back up. In Docker the data directory is a bind mount, so the same files show up
on the host.

## The engine abstraction

TexSet is built to compile more than LaTeX. A document belongs to an *engine*,
and an engine knows three things: how to highlight its source, how to compile
it, and what accent color represents it in the UI. LaTeX (xelatex, green) is the
only engine today. Typst (blue) is the planned second one.

Because the compiler is selected through this abstraction rather than hardcoded,
adding an engine is mostly: implement its compile step, register its editor
language, and pick a color. The rest of the app doesn't need to know which
engine it's dealing with.

## Compilation

When you compile, the server spawns `xelatex` in the project directory and
streams its output back to the browser over Server-Sent Events, so you see the
log as it happens. The editor also auto-compiles on a short debounce after you
stop typing, with a manual compile button for when you want to force a build.

We deliberately avoid a job queue like BullMQ. For a single-user local tool it's
overhead we don't need; a spawned process plus an event stream is simpler and
faster.

## Frontend

The editor is CodeMirror 6. The PDF preview is pdf.js rendering to a canvas.
Styling is Tailwind v3 with a small set of design tokens defined as CSS
variables, which is also how the per-engine accent and (later) dark mode work.
