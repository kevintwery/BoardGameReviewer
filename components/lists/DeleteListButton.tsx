"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteListButtonProps {
  listId: string;
  listName: string;
  gameCount: number;
}

/**
 * Two-step delete: the first click only shows a warning, and the list is
 * deleted only once the user confirms there. Default lists never get
 * this button (the API refuses to delete them anyway).
 */
export function DeleteListButton({ listId, listName, gameCount }: DeleteListButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Put focus on the safe choice, so a stray Enter doesn't delete.
  useEffect(() => {
    if (isConfirming) cancelRef.current?.focus();
  }, [isConfirming]);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    const response = await fetch(`/api/lists/${listId}`, { method: "DELETE" });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Something went wrong deleting this list. Please try again.");
      setIsDeleting(false);
      return;
    }

    router.push("/lists");
    router.refresh();
  }

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
      >
        Delete list
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-labelledby="delete-list-title"
      aria-describedby="delete-list-description"
      className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
    >
      <p id="delete-list-title" className="font-semibold text-red-800 dark:text-red-200">
        Delete &ldquo;{listName}&rdquo;?
      </p>
      <p id="delete-list-description" className="mt-1 text-sm text-red-700 dark:text-red-300">
        {gameCount > 0
          ? `This will remove the list and the ${gameCount} ${gameCount === 1 ? "game" : "games"} saved in it. `
          : "This will remove the list. "}
        This can&apos;t be undone.
      </p>

      {error && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? "Deleting…" : "Yes, delete list"}
        </button>
        <button
          ref={cancelRef}
          type="button"
          onClick={() => {
            setIsConfirming(false);
            setError(null);
          }}
          disabled={isDeleting}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-white dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
