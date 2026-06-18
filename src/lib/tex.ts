import fs from "node:fs";
import path from "node:path";

// Where to find the LaTeX engine. We prefer whatever is installed on the system,
// and fall back to a TeX distribution bundled with the app (the desktop build
// ships TinyTeX and points TEXSET_TEX_BIN_DIR at its bin folder). If neither is
// present, the app shows a banner telling the user how to install one.

function candidateNames(name: string): string[] {
  if (process.platform === "win32") {
    const exts = (process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";");
    return [name, ...exts.map((ext) => name + ext.toLowerCase())];
  }
  return [name];
}

function findOnPath(name: string): string | null {
  const dirs = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    for (const candidate of candidateNames(name)) {
      const full = path.join(dir, candidate);
      try {
        if (fs.statSync(full).isFile()) return full;
      } catch {
        // not here, keep looking
      }
    }
  }
  return null;
}

export interface ResolvedTex {
  // what to spawn (a bare name resolved via PATH, or a full path to a bundled binary)
  command: string;
  // the bundled bin dir to prepend to PATH so the engine finds its siblings
  // (xelatex, bibtex...), or null when using the system install
  binDir: string | null;
}

export function resolveTexBinary(name: string): ResolvedTex | null {
  // a system install on PATH wins
  if (findOnPath(name)) return { command: name, binDir: null };

  // otherwise look in the bundled distribution
  const bundled = process.env.TEXSET_TEX_BIN_DIR;
  if (bundled) {
    for (const candidate of candidateNames(name)) {
      const full = path.join(bundled, candidate);
      if (fs.existsSync(full)) return { command: full, binDir: bundled };
    }
  }

  return null;
}

export function isTexAvailable(): boolean {
  return resolveTexBinary("latexmk") !== null;
}
