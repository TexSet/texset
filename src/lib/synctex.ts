import fs from "fs";
import path from "path";
import { getProjectDir } from "./storage";

export interface SyncTexBlock {
  fileId: number;
  line: number;
  page: number;
  x: number; // in PDF points (bp)
  y: number; // in PDF points (bp)
  w?: number;
  h?: number;
}

export interface SyncTexData {
  files: Record<number, string>;
  blocks: SyncTexBlock[];
}

// Convert TeX scaled points (sp) to PDF points (bp)
// 1 pt = 65536 sp
// 1 bp = 72/72.27 pt
// 1 bp = (72 / 72.27) * 65536 sp ≈ 65781.76 sp
const SP_TO_BP = 72 / 72.27 / 65536;

export function parseSyncTex(projectId: string): SyncTexData | null {
  const synctexPath = path.join(getProjectDir(projectId), "out", "main.synctex");
  if (!fs.existsSync(synctexPath)) {
    return null;
  }

  const content = fs.readFileSync(synctexPath, "utf-8");
  const lines = content.split("\n");

  const data: SyncTexData = {
    files: {},
    blocks: [],
  };

  let currentPage = 1;

  for (const line of lines) {
    if (line.startsWith("Input:")) {
      // Input:1:/path/to/main.tex
      const parts = line.substring(6).split(":");
      if (parts.length >= 2) {
        data.files[parseInt(parts[0], 10)] = parts.slice(1).join(":");
      }
    } else if (line.startsWith("{")) {
      // {1
      currentPage = parseInt(line.substring(1), 10);
    } else if (line.length > 0) {
      // Elements like [1,7:100,200:100,200:0 or x1,9:100,200
      const type = line[0];
      if ("[]()xkgfhvw".includes(type)) {
        // We only care about elements that map to code (have file_id,line)
        const match = line.match(/^[\[\(\]xkgfhvw]?(\d+),(\d+):(-?\d+),(-?\d+)/);
        if (match) {
          const fileId = parseInt(match[1], 10);
          const lineNum = parseInt(match[2], 10);
          const x = parseInt(match[3], 10);
          const y = parseInt(match[4], 10);

          let w, h;
          // Extract width/height if present (e.g. :W,H:D)
          const dimMatch = line.match(/:(-?\d+),(-?\d+):(-?\d+)$/);
          if (dimMatch) {
            w = parseInt(dimMatch[1], 10);
            h = parseInt(dimMatch[2], 10);
          }

          data.blocks.push({
            fileId,
            line: lineNum,
            page: currentPage,
            x: x * SP_TO_BP,
            y: y * SP_TO_BP,
            w: w ? w * SP_TO_BP : undefined,
            h: h ? h * SP_TO_BP : undefined,
          });
        }
      }
    }
  }

  return data;
}

export function findPdfPoint(projectId: string, line: number, fileStr: string = "main.tex"): SyncTexBlock | null {
  const data = parseSyncTex(projectId);
  if (!data) return null;

  // Find file ID
  let targetFileId = 1; // Default
  for (const [id, filepath] of Object.entries(data.files)) {
    if (filepath.includes(fileStr)) {
      targetFileId = parseInt(id, 10);
      break;
    }
  }

  // Find blocks for this file and line
  // Heuristic: Get the first block on the page, or the block with the largest height
  const blocks = data.blocks.filter(b => b.fileId === targetFileId && b.line === line);
  
  if (blocks.length === 0) {
    // Fuzzy search: find nearest line downwards
    const futureBlocks = data.blocks.filter(b => b.fileId === targetFileId && b.line > line);
    if (futureBlocks.length > 0) {
      futureBlocks.sort((a, b) => a.line - b.line);
      return futureBlocks[0];
    }
    return null;
  }

  // Sort by Y coordinate so we get the top of the line
  blocks.sort((a, b) => a.y - b.y);
  return blocks[0];
}

export function findSourceLine(projectId: string, page: number, x: number, y: number): { line: number, file: string } | null {
  const data = parseSyncTex(projectId);
  if (!data) return null;

  const pageBlocks = data.blocks.filter(b => b.page === page);
  if (pageBlocks.length === 0) return null;

  // Find the block with minimum distance to (x, y)
  let bestBlock = pageBlocks[0];
  let minDistance = Infinity;

  for (const block of pageBlocks) {
    // Simple Euclidean distance
    const dx = block.x - x;
    const dy = block.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDistance) {
      minDistance = dist;
      bestBlock = block;
    }
  }

  return {
    line: bestBlock.line,
    file: data.files[bestBlock.fileId] || "main.tex",
  };
}
