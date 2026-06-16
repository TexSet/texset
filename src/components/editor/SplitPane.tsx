"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Two panes side by side with a draggable divider. The left pane width is kept
// as a percentage so it stays sensible when the window resizes.
export function SplitPane({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [leftPercent, setLeftPercent] = useState(50);

  useEffect(() => {
    function onMove(event: PointerEvent) {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((event.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(Math.min(80, Math.max(20, percent)));
    }

    function onUp() {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex h-full w-full">
      <div style={{ width: `${leftPercent}%` }} className="h-full min-w-0">
        {left}
      </div>

      <div
        onPointerDown={() => {
          dragging.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        className="w-1.5 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-accent/50"
        role="separator"
        aria-orientation="vertical"
      />

      <div style={{ width: `${100 - leftPercent}%` }} className="h-full min-w-0">
        {right}
      </div>
    </div>
  );
}
