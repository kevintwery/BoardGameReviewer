"use client";

import { useEffect, useState } from "react";

interface AddToListButtonProps {
  gameId: string;
}

interface GameList {
  id: string;
  name: string;
  items: Array<{ gameId: string }>;
}

/**
 * Dropdown letting a signed-in user toggle a game in/out of any of their
 * lists (Favorites, Want to Buy, Want to Try, Games I Own, or custom
 * lists). Fetches the user's lists on open rather than on mount, so a
 * game page with many visitors who never click this doesn't fire an
 * extra request for each of them.
 */
export function AddToListButton({ gameId }: AddToListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<GameList[] | null>(null);
  const [pendingListId, setPendingListId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || lists !== null) return;

    async function loadLists() {
      const response = await fetch("/api/lists");
      if (response.ok) {
        const data = await response.json();
        setLists(data.lists);
      }
    }
    loadLists();
  }, [isOpen, lists]);

  async function toggleList(list: GameList) {
    const isInList = list.items.some((item) => item.gameId === gameId);
    setPendingListId(list.id);

    await fetch(`/api/lists/${list.id}/items`, {
      method: isInList ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId }),
    });

    // Optimistically update local state instead of refetching, since we
    // already know exactly what changed.
    setLists((current) =>
      current
        ? current.map((l) =>
            l.id === list.id
              ? {
                  ...l,
                  items: isInList
                    ? l.items.filter((item) => item.gameId !== gameId)
                    : [...l.items, { gameId }],
                }
              : l
          )
        : current
    );
    setPendingListId(null);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        + Add to list
      </button>

      {isOpen && (
        <ul className="absolute z-10 mt-1 w-56 rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {lists === null && (
            <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Loading…</li>
          )}
          {lists?.map((list) => {
            const isInList = list.items.some((item) => item.gameId === gameId);
            return (
              <li key={list.id}>
                <button
                  onClick={() => toggleList(list)}
                  disabled={pendingListId === list.id}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-700"
                >
                  <span className="w-4">{isInList ? "✓" : ""}</span>
                  {list.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
