// Dark mode is applied by toggling a "dark" class on <html>, which Tailwind's
// `dark:` variant reacts to (see darkMode: "class" in tailwind.config.ts).
// We persist the choice in localStorage so it survives a page refresh.

const STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;

  // Fall back to the user's OS-level preference if they haven't chosen yet.
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(STORAGE_KEY, theme);
}
