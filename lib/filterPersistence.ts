// Remembers a user's last-used sort/filter choices on the game list page
// across visits, using localStorage. Guests get this too, since it's not
// tied to an account — only synced-to-account persistence would need a
// logged-in user.

const STORAGE_KEY = "gameListFilters";

export interface GameListFilters {
  sortBy: "name" | "rating" | "type";
  sortOrder: "asc" | "desc";
  category?: string;
}

const DEFAULT_FILTERS: GameListFilters = {
  sortBy: "rating",
  sortOrder: "desc",
};

export function loadStoredFilters(): GameListFilters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_FILTERS;

  try {
    return { ...DEFAULT_FILTERS, ...JSON.parse(stored) };
  } catch {
    // Corrupted or old-format data shouldn't crash the page — just fall
    // back to defaults.
    return DEFAULT_FILTERS;
  }
}

export function saveFilters(filters: GameListFilters): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}
