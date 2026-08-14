"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  // Start as null so we don't render a light/dark icon on the server that
  // might not match the user's actual stored preference (avoids a flash
  // of the wrong icon on load).
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  if (theme === null) return null;

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
