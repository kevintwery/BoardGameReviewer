"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

/**
 * Deleting an account is irreversible, so this uses a deliberate
 * two-step confirmation (click "Delete my account" reveals a second,
 * explicit confirm button) rather than a single click or a browser
 * `confirm()` dialog that's easy to reflexively dismiss.
 */
export function DeleteAccountSection() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });

    if (!response.ok) {
      setIsDeleting(false);
      setError("Something went wrong deleting your account. Please try again.");
      return;
    }

    // The account no longer exists at this point — sign out locally and
    // send them home rather than leaving a stale signed-in session in
    // the browser pointed at credentials that were just removed.
    await signOut();
    router.push("/");
  }

  return (
    <div className="mt-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Deleting your account removes your ratings and personal lists permanently,
        and signs you out everywhere. Your forum posts and comments stay up so
        other people's threads keep working, but they'll show as posted by{" "}
        <span className="font-medium">[deleted user]</span> instead of your name.
        This can't be undone.
      </p>

      {!isConfirming ? (
        <button
          onClick={() => setIsConfirming(true)}
          className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-950">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Are you sure? This is permanent.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Yes, permanently delete my account"}
            </button>
            <button
              onClick={() => setIsConfirming(false)}
              disabled={isDeleting}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
