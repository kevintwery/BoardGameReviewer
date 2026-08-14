"use client";

import { useState } from "react";

interface SearchResult {
  bggId: number;
  name: string;
  yearPublished: number | null;
  alreadyAdded: boolean;
}

/**
 * Search-then-import flow for adding new games to the catalog. Search
 * is submit-triggered (not live-as-you-type like the public game
 * search) — this hits BGG's own API on every request rather than our
 * fast local database, so debounced keystroke search would just hammer
 * BGG for no benefit.
 */
export function BggImportSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    const response = await fetch(`/api/admin/bgg/search?q=${encodeURIComponent(query)}`);
    setIsSearching(false);

    if (!response.ok) {
      setError("Search failed. Please try again.");
      return;
    }
    const data = await response.json();
    setResults(data.results);
  }

  async function handleImport(bggId: number) {
    setImportingId(bggId);
    setError(null);

    const response = await fetch("/api/admin/bgg/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bggId }),
    });

    setImportingId(null);

    if (!response.ok) {
      setError("Import failed. Please try again.");
      return;
    }

    // Mark it as already-added locally rather than re-searching, so the
    // list doesn't jump around after a successful import.
    setResults((current) =>
      current
        ? current.map((r) => (r.bggId === bggId ? { ...r, alreadyAdded: true } : r))
        : current
    );
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search BoardGameGeek by name…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {isSearching ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {results !== null && (
        <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
          {results.length === 0 && (
            <li className="py-3 text-sm text-slate-500 dark:text-slate-400">No results.</li>
          )}
          {results.map((result) => (
            <li key={result.bggId} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{result.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {result.yearPublished ?? "Year unknown"} · BGG #{result.bggId}
                </p>
              </div>

              {result.alreadyAdded ? (
                <span className="text-xs font-medium text-slate-400">Already in catalog</span>
              ) : (
                <button
                  onClick={() => handleImport(result.bggId)}
                  disabled={importingId === result.bggId}
                  className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {importingId === result.bggId ? "Importing…" : "Import"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
