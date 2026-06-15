import { spawn } from "child_process";
import { getProjectDir, getOutputDir, getMainTexPath, getOutputPdfPath } from "./storage";
import fs from "fs";

export interface CompileResult {
  success: boolean;
  log: string;
  pdfPath: string | null;
  duration: number;
}

// run xelatex synchronously and return the result (for simple compile button)
export async function compileProject(projectId: string): Promise<CompileResult> {
  const texPath = getMainTexPath(projectId);
  const outDir = getOutputDir(projectId);
  const start = Date.now();

  if (!fs.existsSync(texPath)) {
    return {
      success: false,
      log: "No main.tex file found",
      pdfPath: null,
      duration: 0,
    };
  }

  return new Promise((resolve) => {
    const proc = spawn("xelatex", [
      "-interaction=nonstopmode",
      `-output-directory=${outDir}`,
      texPath,
    ], {
      cwd: getProjectDir(projectId),
      timeout: 30_000, // 30s max
    });

    let log = "";
    proc.stdout.on("data", (data) => { log += data.toString(); });
    proc.stderr.on("data", (data) => { log += data.toString(); });

    proc.on("close", (code) => {
      const pdfPath = getOutputPdfPath(projectId);
      const duration = Date.now() - start;

      resolve({
        success: code === 0 && fs.existsSync(pdfPath),
        log,
        pdfPath: fs.existsSync(pdfPath) ? pdfPath : null,
        duration,
      });
    });

    proc.on("error", (err) => {
      resolve({
        success: false,
        log: `Failed to start xelatex: ${err.message}`,
        pdfPath: null,
        duration: Date.now() - start,
      });
    });
  });
}

// stream compilation output via SSE for real-time feedback
export function compileProjectStream(projectId: string): ReadableStream<Uint8Array> {
  const texPath = getMainTexPath(projectId);
  const outDir = getOutputDir(projectId);
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      if (!fs.existsSync(texPath)) {
        const msg = `data: ${JSON.stringify({ type: "error", message: "No main.tex file found" })}\n\n`;
        controller.enqueue(encoder.encode(msg));
        controller.close();
        return;
      }

      const start = Date.now();

      const proc = spawn("xelatex", [
        "-interaction=nonstopmode",
        `-output-directory=${outDir}`,
        texPath,
      ], {
        cwd: getProjectDir(projectId),
        timeout: 30_000,
      });

      const sendEvent = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // stream might be closed already
        }
      };

      proc.stdout.on("data", (chunk) => {
        sendEvent({ type: "log", content: chunk.toString() });
      });

      proc.stderr.on("data", (chunk) => {
        sendEvent({ type: "log", content: chunk.toString() });
      });

      proc.on("close", (code) => {
        const pdfPath = getOutputPdfPath(projectId);
        const hasPdf = fs.existsSync(pdfPath);
        const duration = Date.now() - start;

        sendEvent({
          type: "done",
          success: code === 0 && hasPdf,
          duration,
        });

        controller.close();
      });

      proc.on("error", (err) => {
        sendEvent({ type: "error", message: `xelatex failed: ${err.message}` });
        controller.close();
      });
    },
  });
}
