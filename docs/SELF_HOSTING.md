# Self-hosting

TexSet is meant to be run on your own machine or server. Docker is the
recommended way because it brings its own TeX Live install.

## With Docker

```bash
git clone https://github.com/texset/texset.git
cd texset
docker compose up --build
```

The app listens on http://localhost:7474. Your documents live in `./projects`
next to the repo, mounted into the container, so they're yours to back up, move,
or edit directly.

To run it in the background:

```bash
docker compose up --build -d
```

To stop it:

```bash
docker compose down
```

## Configuration

A couple of environment variables, both with sensible defaults. Copy
`.env.example` to `.env` to set them.

| Variable          | Default      | What it does                              |
| ----------------- | ------------ | ----------------------------------------- |
| `PORT`            | `7474`       | Port the app listens on.                  |
| `TEXSET_DATA_DIR` | `./projects` | Where projects and the SQLite index live. |

### Changing the port

Edit the port mapping in `docker-compose.yml`. The left side is the host port:

```yaml
ports:
  - "8123:7474"
```

That serves TexSet on http://localhost:8123.

### Moving your data elsewhere

Point the bind mount at any folder you like:

```yaml
volumes:
  - /path/to/my/documents:/app/projects
```

## Without Docker

You can run TexSet directly if you have Node.js 20+, pnpm, and a TeX Live
install that provides `xelatex`.

```bash
pnpm install
pnpm build
pnpm start
```

This is more setup, and you're responsible for keeping `xelatex` and the LaTeX
packages your documents need installed. Docker avoids all of that.

## A note on resources

TexSet is single-user and lightweight by design. The SQLite index only holds
metadata, and compilation is an on-demand child process, so it idles at close to
nothing. The largest thing on disk is the TeX Live install inside the image.
