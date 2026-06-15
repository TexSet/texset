# Architecture

This document describes how TexSet is built and why certain decisions were made.

## Overview

TexSet is a full-stack Next.js application using the App Router. The frontend and backend live in the same codebase -- React components handle the UI, and API route handlers manage compilation, file storage, and metadata.

Everything runs in a single Docker container. There's no separate database server, no message queue, no external services. The goal is a single `docker compose up` to get a working LaTeX editor.

## Services Diagram

```
+------------------+       +-----------------------------------+
|                  |       |          Next.js Server            |
|     Browser      | <---> |                                   |
|                  |       |   React UI    |    API Routes      |
|  - CodeMirror    |  HTTP |   (App Router)|   (/api/*)        |
|  - pdf.js        | <---> |              |                    |
|                  |       +--------------+--------------------+
+------------------+              |              |
                                  v              v
                           +----------+   +------------+
                           |  SQLite  |   | Filesystem |
                           | (metadata)|  | (.tex, PDF)|
                           +----------+   +------------+
                                                |
                                                v
                                         +-----------+
                                         |  xelatex  |
                                         | (TeX Live)|
                                         +-----------+
```

## Directory Structure

```
src/
  app/
    api/
      compile/       # POST handler -- spawns xelatex, streams output
      projects/      # CRUD for project metadata
      templates/     # Template listing and creation
    editor/          # Editor page (CodeMirror + preview pane)
    gallery/         # Template gallery page
    layout.tsx       # Root layout
    page.tsx         # Landing / project list
  components/
    Editor.tsx       # CodeMirror wrapper
    PdfViewer.tsx    # pdf.js wrapper
    Toolbar.tsx      # Editor toolbar (compile, download, etc.)
  lib/
    compiler.ts      # xelatex process management
    db.ts            # SQLite connection and queries
    storage.ts       # File read/write helpers
  db/
    schema.sql       # Database schema
    migrations/      # Schema migrations
public/              # Static assets (logos, icons)
docs/                # Project documentation
projects/            # User project files (bind-mounted in Docker)
```

## Compilation Data Flow

Here's what happens when a user compiles a document:

```
1. User types in CodeMirror editor
2. Input is debounced (~500ms after last keystroke)
3. Frontend sends POST /api/compile with project ID and .tex content
4. API route writes the .tex file to disk
5. API route spawns xelatex as a child process
6. Compilation output is streamed back via SSE (Server-Sent Events)
7. On success, the generated PDF path is sent in the final SSE event
8. Frontend fetches the PDF and renders it with pdf.js
```

The compilation is intentionally synchronous per-project -- only one xelatex process runs per project at a time. If a new compilation request arrives while one is in progress, the running process is killed and replaced.

## Storage

**SQLite** stores project metadata:
- Project ID, name, creation date, last modified
- Template associations
- Compilation status and error logs

**Filesystem** stores the actual files:
- `.tex` source files
- Generated `.pdf` files
- xelatex auxiliary files (`.aux`, `.log`, `.toc`, etc.)

All project files live under `./projects/`, which is bind-mounted into the Docker container at `/app/projects`. This makes backups straightforward -- just copy the directory.

## Design Decisions

### Why SQLite over Postgres?

TexSet is a single-user application. There's no concurrent write contention, no need for replication, and no reason to run a separate database server. SQLite is embedded, requires zero configuration, and the database file lives alongside the project files. One fewer thing to set up, one fewer thing to break.

### Why SSE over WebSocket?

Compilation output is unidirectional -- the server sends log lines to the client. SSE is a natural fit for this pattern. It's simpler than WebSocket, works over standard HTTP, and doesn't require special proxy configuration. The connection is opened for the duration of a single compilation and then closed.

### Why xelatex?

xelatex supports Unicode natively and can use system fonts without extra configuration. For a self-hosted editor where users might write in any language, this matters. pdflatex would require font encoding packages for anything beyond ASCII. LuaLaTeX is an alternative, but xelatex has broader adoption and faster compilation for most documents.
