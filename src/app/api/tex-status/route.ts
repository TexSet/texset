import { NextResponse } from "next/server";
import { isTexAvailable } from "@/lib/tex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tells the UI whether a LaTeX engine is reachable, so it can warn up front
// instead of letting a compile mysteriously fail.
export function GET() {
  return NextResponse.json({ available: isTexAvailable() });
}
