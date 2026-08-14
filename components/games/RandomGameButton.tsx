"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RandomGameButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function goToRandomGame() {
    setIsLoading(true);
    const response = await fetch("/api/games/random");
    const data = await response.json();
    setIsLoading(false);

    if (data.slug) router.push(`/games/${data.slug}`);
  }

  return (
    <button
      onClick={goToRandomGame}
      disabled={isLoading}
      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      {isLoading ? "Picking…" : "🎲 Surprise me"}
    </button>
  );
}
