import { spawn } from "node:child_process";
import fs from "node:fs";
import { getEngine, type Engine } from "./engines";
import { projectDir, projectOutputDir } from "./paths";
import { mainSourcePath, outputPdfPath, ensureProjectDirs } from "./storage";

export interface CompileResult {
  success: boolean;
  log: string;
  durationMs: number;
  passes: number;
}

// LaTeX often needs a second run to settle cross-references, the table of
// contents, and labels. We re-run while the log asks for it, capped so a
// genuinely broken document can't loop forever.
const MAX_PASSES = 3;
const PASS_TIMEOUT_MS = 60_000;

function needsRerun(log: string): boolean {
  return /rerun to get|label\(s\) may have changed|undefined references/i.test(
    log,
  );
}

// run the compiler once, forwarding output to onLog as it arrives
function runPass(
  command: string,
  args: string[],
  cwd: string,
  onLog?: (chunk: string) => void,
): Promise<{ code: number | null; log: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { cwd, timeout: PASS_TIMEOUT_MS });

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
// API routes go through here.
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
    return { success: false, log: message, durationMs: 0, passes: 0 };
  }

  const mainPath = mainSourcePath(projectId, engine);
  if (!fs.existsSync(mainPath)) {
    const message = `No ${engine.mainFileName} found for this project.\n`;
    onLog?.(message);
    return { success: false, log: message, durationMs: 0, passes: 0 };
  }

  ensureProjectDirs(projectId);
  const { command, args } = engine.buildCommand({
    mainPath,
    outDir: projectOutputDir(projectId),
  });
  const cwd = projectDir(projectId);

  const start = Date.now();
  let log = "";
  let lastCode: number | null = null;
  let passes = 0;

  for (let i = 0; i < MAX_PASSES; i++) {
    const pass = await runPass(command, args, cwd, onLog);
    passes++;
    log += pass.log;
    lastCode = pass.code;

    if (pass.code !== 0) break; // a failed run won't get better on a rerun
    if (!needsRerun(pass.log)) break; // references are settled
  }

  const pdfExists = fs.existsSync(outputPdfPath(projectId, engine));
  return {
    success: lastCode === 0 && pdfExists,
    log,
    durationMs: Date.now() - start,
    passes,
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
        durationMs: result.durationMs,
        passes: result.passes,
      });
      controller.close();
    },
  });
}
