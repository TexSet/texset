import fs from "node:fs";
import path from "node:path";
import { projectDir, projectOutputDir } from "./paths";
import type { Engine } from "./engines";

// Filesystem side of a project: the source files and the compiled output. Each
// project is a directory under the data dir, with an output/ subfolder the
// compiler writes into.

export function ensureProjectDirs(projectId: string): void {
  // creating the output dir also creates the project dir above it
  fs.mkdirSync(projectOutputDir(projectId), { recursive: true });
}

export function mainSourcePath(projectId: string, engine: Engine): string {
  return path.join(projectDir(projectId), engine.mainFileName);
}

export function readSource(projectId: string, engine: Engine): string {
  const file = mainSourcePath(projectId, engine);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

export function writeSource(
  projectId: string,
  engine: Engine,
  content: string,
): void {
  ensureProjectDirs(projectId);
  fs.writeFileSync(mainSourcePath(projectId, engine), content, "utf8");
}

export function outputPdfPath(projectId: string, engine: Engine): string {
  return path.join(projectOutputDir(projectId), engine.outputFileName);
}

export function removeProjectFiles(projectId: string): void {
  fs.rmSync(projectDir(projectId), { recursive: true, force: true });
}

export type FileKind = "tex" | "image" | "pdf" | "other";

export interface ProjectFile {
  name: string;
  size: number;
  kind: FileKind;
}

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

function fileKind(name: string): FileKind {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".tex") return "tex";
  if (ext === ".pdf") return "pdf";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  return "other";
}

// Reduce whatever the client sent to a bare filename inside the project. basename
// drops any directory part, so "../../etc/passwd" becomes "passwd" and can't
// escape the project folder. "output" is reserved for compiled artifacts.
export function safeFileName(name: string): string | null {
  const base = path.basename(name).trim();
  if (!base || base === "." || base === "..") return null;
  if (base === "output") return null;
  if (/[/\\\0]/.test(base)) return null;
  return base;
}

// the on-disk path for a project file, or null if the name isn't safe
export function resolveProjectFile(
  projectId: string,
  name: string,
): string | null {
  const safe = safeFileName(name);
  if (!safe) return null;
  return path.join(projectDir(projectId), safe);
}

// every regular file in the project directory except the output folder
export function listProjectFiles(projectId: string): ProjectFile[] {
  const dir = projectDir(projectId);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      name: entry.name,
      size: fs.statSync(path.join(dir, entry.name)).size,
      kind: fileKind(entry.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function writeProjectFile(
  projectId: string,
  name: string,
  data: Buffer,
): boolean {
  const target = resolveProjectFile(projectId, name);
  if (!target) return false;
  ensureProjectDirs(projectId);
  fs.writeFileSync(target, data);
  return true;
}

export function deleteProjectFile(projectId: string, name: string): boolean {
  const target = resolveProjectFile(projectId, name);
  if (!target || !fs.existsSync(target)) return false;
  fs.rmSync(target);
  return true;
}
