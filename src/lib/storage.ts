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
