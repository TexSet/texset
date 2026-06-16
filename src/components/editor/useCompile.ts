"use client";

import { useCallback, useRef, useState } from "react";

export type CompileStatus =
  | "idle"
  | "running"
  | "success"
  | "error"
  | "empty";

// Drives compilation for one project. Reads the Server-Sent Events stream from
// the compile route, accumulating the log and learning when the PDF is ready.
// If a compile is requested while one is already running, the new one is queued
// and runs right after, so the final edit always ends up compiled.
export function useCompile(projectId: string) {
  const [status, setStatus] = useState<CompileStatus>("idle");
  const [log, setLog] = useState("");
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [pdfVersion, setPdfVersion] = useState(0);

  const running = useRef(false);
  const queued = useRef(false);

  const runOnce = useCallback(async () => {
    setStatus("running");
    setLog("");

    let success = false;
    let empty = false;
    let duration: number | null = null;

    try {
      const res = await fetch(`/api/projects/${projectId}/compile`, {
        method: "POST",
      });
      if (!res.ok || !res.body) {
        throw new Error(`Compile request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // events are separated by a blank line
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          const data = frame.startsWith("data:")
            ? frame.slice(5).trim()
            : frame.trim();
          if (!data) continue;

          const event = JSON.parse(data);
          if (event.type === "log") setLog((prev) => prev + event.chunk);
          else if (event.type === "error") setLog((prev) => prev + event.message);
          else if (event.type === "done") {
            success = event.success;
            empty = event.empty;
            duration = event.durationMs;
          }
        }
      }
    } catch (err) {
      setLog((prev) => prev + `\n${err instanceof Error ? err.message : err}\n`);
      success = false;
    }

    setDurationMs(duration);
    if (success) {
      setStatus("success");
      setPdfVersion((v) => v + 1);
    } else if (empty) {
      setStatus("empty");
    } else {
      setStatus("error");
    }
  }, [projectId]);

  const compile = useCallback(async () => {
    if (running.current) {
      queued.current = true;
      return;
    }
    running.current = true;
    try {
      do {
        queued.current = false;
        await runOnce();
      } while (queued.current);
    } finally {
      running.current = false;
    }
  }, [runOnce]);

  return { compile, status, log, durationMs, pdfVersion };
}
