# TexSet

A fast, self-hosted LaTeX editor. Write, compile, and preview LaTeX documents from your browser -- no installs, no accounts, no cloud dependency.

## Quick Start

```bash
git clone https://github.com/texset/texset.git
cd texset
docker compose up --build
```

Open [http://localhost:7474](http://localhost:7474) and start writing.

## Features

- Real-time PDF preview powered by pdf.js
- CodeMirror 6 editor with LaTeX syntax highlighting
- Template gallery for common document types
- PDF export and download
- Offline-first -- works without an internet connection
- Cross-platform via Docker (macOS, Linux, Windows)
- Single-user, no authentication required
- Project files stored on your filesystem

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Framework   | Next.js 14 (App Router)             |
| Language    | TypeScript (strict mode)            |
| Styling     | Tailwind CSS v3                     |
| Editor      | CodeMirror 6                        |
| PDF Viewer  | pdf.js                              |
| Database    | SQLite (better-sqlite3)             |
| TeX Engine  | xelatex (TeX Live)                  |
| Runtime     | Node.js 20                          |
| Container   | Docker (node:20-bookworm-slim)      |
| Pkg Manager | pnpm                                |

## Development

Make sure you have Node.js 20+ and pnpm installed.

```bash
pnpm install
pnpm dev
```

The dev server starts on [http://localhost:7474](http://localhost:7474).

For Docker-based development:

```bash
docker compose -f docker-compose.dev.yml up
```

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines on branching, commits, and pull requests.

## Self-Hosting

See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) for Docker deployment instructions and configuration options.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for an overview of how TexSet is built.

## License

[MIT](LICENSE)
