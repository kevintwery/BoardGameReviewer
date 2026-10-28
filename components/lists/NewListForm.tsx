"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Matches listCreateSchema in lib/validation.ts.
const MAX_LIST_NAME_LENGTH = 60;

/**
 * Lets a user add their own list alongside the default ones. After a
 * successful create we refresh the server-rendered /lists page so the
 * new list shows up in place, without a full reload.
 */
export function NewListForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please give your list a name.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Something went wrong creating your list. Please try again.");
      return;
    }

    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <label htmlFor="newListName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Create a new list
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="newListName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_LIST_NAME_LENGTH}
          placeholder="e.g. Two-player games"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="shrink-0 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create list"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
