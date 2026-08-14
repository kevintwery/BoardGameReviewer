"use client";

import { useState } from "react";
import { SignedIn } from "@clerk/nextjs";

interface ReportButtonProps {
  contentType: "POST" | "COMMENT";
  contentId: string;
}

/**
 * Lets a signed-in user flag a post or comment for moderator review.
 * Deliberately understated (small text link, not a big red button) —
 * reporting should be easy to find but not so prominent it invites
 * casual misuse as a "disagree" button.
 */
export function ReportButton({ contentType, contentId }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 3) return;

    setStatus("submitting");
    const response = await fetch("/api/moderation/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType,
        [contentType === "POST" ? "postId" : "commentId"]: contentId,
        reason: reason.trim(),
      }),
    });

    setStatus(response.ok ? "done" : "error");
  }

  if (status === "done") {
    return <p className="text-xs text-slate-500 dark:text-slate-400">Thanks — a moderator will take a look.</p>;
  }

  return (
    <SignedIn>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="text-xs text-slate-400 hover:text-slate-600 hover:underline dark:text-slate-500 dark:hover:text-slate-300"
        >
          Report
        </button>
      ) : (
        <form onSubmit={submitReport} className="mt-2 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What's wrong with this? (spam, harassment, off-topic…)"
            rows={2}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={status === "submitting" || reason.trim().length < 3}
              className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {status === "submitting" ? "Submitting…" : "Submit report"}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-500 hover:underline dark:text-slate-400"
            >
              Cancel
            </button>
          </div>
          {status === "error" && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Something went wrong submitting that. Please try again.
            </p>
          )}
        </form>
      )}
    </SignedIn>
  );
}
