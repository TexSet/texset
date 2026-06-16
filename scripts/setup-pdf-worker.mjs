// Copies the pdf.js worker into public/ so the preview can load it from a plain
// URL. Bundling the worker through webpack trips over its ESM syntax, and we
// want it served locally anyway to stay offline-first. Runs before dev and build.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(
  root,
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
);
const destination = join(root, "public/pdf.worker.min.mjs");

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
console.log("Copied pdf.js worker to public/pdf.worker.min.mjs");
