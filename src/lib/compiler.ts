import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getEngine, type Engine } from "./engines";
import { projectDir, projectOutputDir } from "./paths";
import { mainSourcePath, outputPdfPath, ensureProjectDirs } from "./storage";
import { resolveTexBinary } from "./tex";

export interface CompileResult {
  // the compiler exited cleanly with a PDF
  success: boolean;
  // a PDF came out even if there were errors. LaTeX often still produces one,
  // and we'd rather show it (with the errors) than hide it, like Overleaf does.
  pdfProduced: boolean;
  // the document compiled cleanly but had nothing to typeset (an empty body).
  // not a failure, just nothing to preview yet.
  empty: boolean;
  log: string;
  durationMs: number;
}

// latexmk reruns the engine and bibtex/makeindex on its own, so a single run can
// take a while on a big document. give it room.
const COMPILE_TIMEOUT_MS = 120_000;

// run the compiler once, forwarding output to onLog as it arrives
function runCommand(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  onLog?: (chunk: string) => void,
): Promise<{ code: number | null; log: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { cwd, env, timeout: COMPILE_TIMEOUT_MS });

    let log = "";
    const collect = (data: Buffer) => {
      const text = data.toString();
      log += text;
      onLog?.(text);
    };

    proc.stdout.on("data", collect);
    proc.stderr.on("data", collect);
    proc.on("close", (code) => resolve({ code, log }));
    proc.on("error", (err) => {
      const message = `Failed to start ${command}: ${err.message}\n`;
      log += message;
      onLog?.(message);
      resolve({ code: null, log });
    });
  });
}

// Compile a project, optionally streaming the log through onLog. This is the one
// place that actually drives the compiler; both the one-shot and the streaming
// API routes go through here. The engine's command (latexmk for LaTeX) takes
// care of reruns and auxiliary tools.
export async function runCompile(
  projectId: string,
  engineId: string,
  onLog?: (chunk: string) => void,
): Promise<CompileResult> {
  let engine: Engine;
  try {
    engine = getEngine(engineId);
  } catch {
    const message = `Unknown engine: ${engineId}\n`;
    onLog?.(message);
    return {
      success: false,
      pdfProduced: false,
      empty: false,
      log: message,
      durationMs: 0,
    };
  }

  const mainPath = mainSourcePath(projectId, engine);
  if (!fs.existsSync(mainPath)) {
    const message = `No ${engine.mainFileName} found for this project.\n`;
    onLog?.(message);
    return {
      success: false,
      pdfProduced: false,
      empty: false,
      log: message,
      durationMs: 0,
    };
  }

  ensureProjectDirs(projectId);
  const { command, args } = engine.buildCommand({
    mainPath,
    outDir: projectOutputDir(projectId),
  });

  // find the engine: a system install, or the bundled TinyTeX
  const tex = resolveTexBinary(command);
  if (!tex) {
    const message =
      `${command} was not found. Install a LaTeX distribution (TeX Live or ` +
      `MiKTeX) and reopen, or use the TexSet desktop app, which includes one.\n`;
    onLog?.(message);
    return {
      success: false,
      pdfProduced: false,
      empty: false,
      log: message,
      durationMs: 0,
    };
  }

  // when using the bundled distribution, put its bin dir first so the engine
  // finds its companions (xelatex, bibtex, makeindex)
  const env = tex.binDir
    ? {
        ...process.env,
        PATH: `${tex.binDir}${path.delimiter}${process.env.PATH ?? ""}`,
      }
    : process.env;

  const start = Date.now();
  const result = await runCommand(
    tex.command,
    args,
    projectDir(projectId),
    env,
    onLog,
  );

  const pdfExists = fs.existsSync(outputPdfPath(projectId, engine));
  // an empty body makes the engine finish cleanly with no PDF and this notice
  const empty = !pdfExists && /no pages of output/i.test(result.log);

  return {
    success: result.code === 0 && pdfExists,
    pdfProduced: pdfExists,
    empty,
    log: result.log,
    durationMs: Date.now() - start,
  };
}

// Server-Sent Events version for live feedback in the editor. Emits { type:
// "log" } chunks as the compiler runs, then a final { type: "done" }.
export function compileStream(
  projectId: string,
  engineId: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // the client may have disconnected; nothing useful to do here
        }
      };

      const result = await runCompile(projectId, engineId, (chunk) =>
        send({ type: "log", chunk }),
      );

      send({
        type: "done",
        success: result.success,
        pdfProduced: result.pdfProduced,
        empty: result.empty,
        durationMs: result.durationMs,
      });
      controller.close();
    },
  });
}
