"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

// the source of truth is data-theme on <html>, set before paint by the inline
// script in the layout. a custom event keeps every toggle/consumer in sync.
const THEME_EVENT = "texset-theme-change";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(currentTheme());
    const sync = () => setTheme(currentTheme());
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("texset-theme", next);
    } catch {
      // storage can be unavailable (private mode); the toggle still works for now
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return { theme, toggle };
}
