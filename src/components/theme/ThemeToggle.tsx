"use client";

import { Moon, Sun } from "lucide-react";
import { clsx } from "clsx";
import { useTheme } from "./useTheme";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      className={clsx(
        "flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-2 hover:text-text",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
