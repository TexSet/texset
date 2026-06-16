// An engine is a document type TexSet can edit and compile. Today there's only
// LaTeX, but everything that varies between document types lives behind this
// interface: the source file name, how to invoke the compiler, the starter
// content for a blank document, and the accent color the UI uses. Adding Typst
// later means adding one entry here, nothing else structural.

export type EngineId = "latex";

export interface Engine {
  id: EngineId;
  // display name shown in the UI
  name: string;
  // the main source file inside a project directory
  mainFileName: string;
  // the file the compiler produces, relative to the output directory
  outputFileName: string;
  // what a fresh blank document starts with
  blankSource: string;
  // builds the command and arguments to compile a project
  buildCommand(ctx: { mainPath: string; outDir: string }): {
    command: string;
    args: string[];
  };
}

const LATEX_BLANK = `\\documentclass[11pt]{article}

\\begin{document}

\\end{document}
`;

export const engines: Record<EngineId, Engine> = {
  latex: {
    id: "latex",
    name: "LaTeX",
    mainFileName: "main.tex",
    outputFileName: "main.pdf",
    blankSource: LATEX_BLANK,
    buildCommand: ({ mainPath, outDir }) => ({
      command: "xelatex",
      args: [
        // never stop for a prompt, we have no terminal to answer it
        "-interaction=nonstopmode",
        // generate synctex data so we can map between source and PDF later
        "-synctex=1",
        `-output-directory=${outDir}`,
        mainPath,
      ],
    }),
  },
};

export const DEFAULT_ENGINE: EngineId = "latex";

export function isEngineId(id: string): id is EngineId {
  return Object.prototype.hasOwnProperty.call(engines, id);
}

export function getEngine(id: string): Engine {
  if (!isEngineId(id)) {
    throw new Error(`Unknown engine: ${id}`);
  }
  return engines[id];
}
