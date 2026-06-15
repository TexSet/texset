# Self-Hosting Guide

TexSet is designed to run on your own hardware with Docker. No cloud account, no external dependencies.

## Requirements

- Docker 20.10+
- Docker Compose v2

That's it. Everything else (Node.js, TeX Live, pnpm) is inside the container.

## Quick Start

```bash
git clone https://github.com/texset/texset.git
cd texset
docker compose up --build
```

Open [http://localhost:7474](http://localhost:7474). Your LaTeX editor is running.

To run in the background:

```bash
docker compose up --build -d
```

## Configuration

TexSet is configured through environment variables. Set them in a `.env` file at the project root or pass them directly to `docker compose`.

| Variable             | Default          | Description                           |
| -------------------- | ---------------- | ------------------------------------- |
| `PORT`               | `7474`           | Port the application listens on       |
| `TEXSET_PROJECTS_DIR`| `./projects`     | Host path for project file storage    |

Example `.env` file:

```env
PORT=8080
TEXSET_PROJECTS_DIR=/home/user/latex-projects
```

If you change the port, update the port mapping in `docker-compose.yml` to match:

```yaml
ports:
  - "8080:8080"
```

## Data Persistence

All project data -- `.tex` files, compiled PDFs, and the SQLite database -- is stored in the `./projects/` directory on your host machine. This directory is bind-mounted into the container:

```yaml
volumes:
  - ./projects:/app/projects
```

To back up your data, just copy the `projects/` directory. To migrate to a new machine, move the entire repo (or just `projects/`) and run `docker compose up --build`.

The container itself is stateless. You can delete and recreate it without losing any data, as long as `projects/` is intact.

## Updating

Pull the latest changes and rebuild:

```bash
git pull origin main
docker compose up --build
```

Or if you're using a published image:

```bash
docker compose pull
docker compose up -d
```

Your project data in `./projects/` is unaffected by updates.

## Troubleshooting

### Port already in use

If port 7474 is taken, either stop the conflicting service or change the port:

```bash
PORT=9090 docker compose up --build
```

And update the port mapping in `docker-compose.yml`.

### Permission denied on Linux

Docker containers run as root by default, which can create files owned by root in your `projects/` directory. To fix this, set the container user to match your host UID/GID:

```yaml
# docker-compose.yml
services:
  texset:
    user: "${UID}:${GID}"
```

Then export your UID and GID before running:

```bash
export UID=$(id -u)
export GID=$(id -g)
docker compose up --build
```

### Compilation fails with "xelatex not found"

This shouldn't happen with the default Docker image, which includes TeX Live. If you're running outside Docker, make sure xelatex is installed and available on your PATH:

```bash
which xelatex
```

On Debian/Ubuntu:

```bash
sudo apt install texlive-xetex
```

### Container exits immediately

Check the logs:

```bash
docker compose logs texset
```

Common causes: port conflict, missing `projects/` directory permissions, or a corrupted `node_modules` (try rebuilding with `--no-cache`):

```bash
docker compose build --no-cache
docker compose up
```
