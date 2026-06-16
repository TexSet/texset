import path from "node:path";

// Root folder for everything TexSet writes: the SQLite index plus one directory
// per project holding its sources and compiled output. Configurable so people
// can point it at a bind mount or any disk they like; defaults to ./projects.
export const DATA_DIR = path.resolve(
  process.env.TEXSET_DATA_DIR ?? path.join(process.cwd(), "projects"),
);

export const DB_PATH = path.join(DATA_DIR, "texset.db");

export function projectDir(projectId: string): string {
  return path.join(DATA_DIR, projectId);
}

// compiled artifacts (PDF, logs, synctex) live next to the sources but in their
// own folder so a clean build is just wiping this directory
export function projectOutputDir(projectId: string): string {
  return path.join(projectDir(projectId), "output");
}
