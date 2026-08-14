"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface PlannerResult {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  playingTime: number;
  avgRating: number;
}

const TIME_OPTIONS = [
  { label: "Any", value: 0 },
  { label: "Under 30 min", value: 30 },
  { label: "Under 60 min", value: 60 },
  { label: "Under 90 min", value: 90 },
];

/**
 * "What should we play tonight?" tool: pick how many people are playing
 * and how much time you have, get a shortlist. Reuses fields we already
 * sync from BGG (minPlayers/maxPlayers/playingTime), so this needed no
 * new schema — just a filtered query, see app/api/games/planner/route.ts.
 */
export function GameNightPlanner() {
  const [players, setPlayers] = useState(4);
  const [maxMinutes, setMaxMinutes] = useState(0);
  const [results, setResults] = useState<PlannerResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function findGames() {
    setIsLoading(true);
    const response = await fetch(
      `/api/games/planner?players=${players}&maxMinutes=${maxMinutes}`
    );
    const data = await response.json();
    setResults(data.games);
    setIsLoading(false);
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="players" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            How many players?
          </label>
          <input
            id="players"
            type="number"
            min={1}
            max={20}
            value={players}
            onChange={(e) => setPlayers(Number(e.target.value))}
            className="mt-1 w-20 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Time available
          </label>
          <select
            id="time"
            value={maxMinutes}
            onChange={(e) => setMaxMinutes(Number(e.target.value))}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            {TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={findGames}
          disabled={isLoading}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {isLoading ? "Finding games…" : "Find games"}
        </button>
      </div>

      {results !== null && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {results.length === 0 && (
            <p className="col-span-full text-sm text-slate-500 dark:text-slate-400">
              No games match — try widening your filters.
            </p>
          )}
          {results.map((game) => (
            <Link key={game.id} href={`/games/${game.slug}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded-md">
                <Image
                  src={game.imageUrl}
                  alt={game.name}
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
              </div>
              <p className="mt-1 truncate text-sm font-medium">{game.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{game.playingTime} min</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
