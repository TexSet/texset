# Contributing

Glad to have you. This is a small, focused project and we'd like to keep it that
way, so a few conventions go a long way.

## Setup

```bash
pnpm install
pnpm dev
```

You'll need Node.js 20+ and pnpm. For compiling documents you also need
`xelatex` on your `PATH`, or use the Docker dev setup which bundles TeX Live:

```bash
docker compose -f docker-compose.dev.yml up
```

## Branching and pull requests

`main` is always deployable. Don't commit to it directly; branch off it instead.

1. Make sure your `main` is current before branching, so your PR merges cleanly:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/short-description
   ```
2. Use a descriptive branch name with a type prefix: `feat/`, `fix/`, `docs/`,
   `refactor/`, `chore/`.
3. Open a pull request against `main`. The template will prompt you for what
   changed, how you tested it, and a short checklist.
4. CI runs lint, typecheck, and build on every PR. Keep it green.

## Commits

Short, present-tense, descriptive. Conventional Commits style is encouraged:

```
feat: add letter template
fix: handle missing main.tex on compile
docs: explain the engine abstraction
```

## Code style

- Everything in the codebase is American English: code, comments, identifiers,
  UI strings. (Issues and discussion can be in whatever language works for you.)
- Comments explain *why*, in a normal human voice. Skip decorative banners.
- TypeScript runs in strict mode. `pnpm typecheck` should pass.
- Prefer small, reviewable PRs over large ones.

## Before you push

```bash
pnpm lint
pnpm typecheck
pnpm build
```

If all three pass, you're good to open the PR.
