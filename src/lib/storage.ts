import path from "path";
import fs from "fs";

// where project files live on disk
const projectsDir =
  process.env.TEXSET_PROJECTS_DIR || path.join(process.cwd(), "projects");

export function getProjectsDir(): string {
  fs.mkdirSync(projectsDir, { recursive: true });
  return projectsDir;
}

export function getProjectDir(projectId: string): string {
  const dir = path.join(getProjectsDir(), projectId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getOutputDir(projectId: string): string {
  const dir = path.join(getProjectDir(projectId), "out");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getMainTexPath(projectId: string): string {
  return path.join(getProjectDir(projectId), "main.tex");
}

export function getOutputPdfPath(projectId: string): string {
  return path.join(getOutputDir(projectId), "main.pdf");
}

export function getDatabasePath(): string {
  return path.join(getProjectsDir(), ".texset.db");
}
