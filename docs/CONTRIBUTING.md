# Contributing to TexSet

Thanks for your interest in contributing. This guide covers the workflow and conventions we follow.

## Prerequisites

- Node.js 20+
- pnpm
- Docker (for container-based development and testing)

## Getting Started

1. Fork the repo on GitHub.
2. Clone your fork:

```bash
git clone https://github.com/<your-username>/texset.git
cd texset
```

3. Install dependencies:

```bash
pnpm install
```

4. Start the dev server:

```bash
pnpm dev
```

5. Open [http://localhost:7474](http://localhost:7474).

To run with Docker instead:

```bash
docker compose -f docker-compose.dev.yml up
```

## Branch Naming

Create branches off `main` using the following prefixes:

| Prefix   | Use case                  |
| -------- | ------------------------- |
| `feat/`  | New features              |
| `fix/`   | Bug fixes                 |
| `docs/`  | Documentation changes     |
| `chore/` | Tooling, deps, CI, etc.   |

Examples: `feat/template-gallery`, `fix/pdf-render-crash`, `docs/update-readme`.

## Commit Messages

We use conventional commits. The format is:

```
<type>: <short description>
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`.

Examples:

```
feat: add template gallery page
fix: prevent double compilation on rapid keystrokes
docs: add self-hosting guide
chore: bump next.js to 14.2
```

Keep the subject line under 72 characters. Use the body for context when the subject alone isn't enough.

## Submitting a Pull Request

1. Push your branch to your fork.
2. Open a PR against `main` on the upstream repo.
3. In the PR description:
   - Describe what you changed and why.
   - Reference related issues (e.g., `Closes #42`).
   - Include screenshots if the change is visual.
4. Make sure linting passes:

```bash
pnpm lint
```

PRs are reviewed before merging. Small, focused PRs are easier to review and land faster.

## Code Style

- TypeScript in strict mode. No `any` unless absolutely unavoidable (and if so, leave a comment explaining why).
- Use natural, concise comments. Write them like a human developer, not a textbook.
- No decorative comment separators (`// ====`, `// ----`, etc.).
- Prefer named exports. Default exports only for pages and layouts (Next.js convention).
- Use Tailwind utility classes for styling. Avoid inline styles.

## Project Structure

```
src/
  app/           # Next.js App Router pages and layouts
    api/         # API route handlers
  components/    # React components
  lib/           # Shared utilities and helpers
  db/            # SQLite database access
public/          # Static assets
docs/            # Project documentation
```

## Questions?

Open an issue or start a discussion on GitHub. We're happy to help.
