"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
}

const DEBOUNCE_MS = 300;

/**
 * Live search-as-you-type box. Debounces input so we're not firing a
 * request on every keystroke, and hits our own /api/games/search route
 * (which queries our own synced database — not BGG directly, so results
 * are fast).
 */
export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    // Debounce: wait until the user pauses typing before searching, and
    // cancel the pending search if they type again before it fires.
    const timeoutId = setTimeout(async () => {
      const response = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.games);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="relative w-full sm:w-72">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)} // delay so a click on a result registers first
        placeholder="Search games..."
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
      />

      {isOpen && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {results.map((game) => (
            <li key={game.id}>
              <Link
                href={`/games/${game.slug}`}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Image src={game.imageUrl} alt="" width={32} height={32} className="rounded" />
                {game.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
