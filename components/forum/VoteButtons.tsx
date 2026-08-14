"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface VoteButtonsProps {
  postId: string;
  initialNetVotes: number;
}

/**
 * Upvote/downvote control for a forum post. Optimistically updates the
 * displayed count before the request resolves, then corrects if the
 * request fails — keeps voting feeling instant.
 */
export function VoteButtons({ postId, initialNetVotes }: VoteButtonsProps) {
  const { isSignedIn } = useAuth();
  const [netVotes, setNetVotes] = useState(initialNetVotes);
  const [myVote, setMyVote] = useState<1 | -1 | null>(null);

  async function castVote(voteValue: 1 | -1) {
    if (!isSignedIn) return;

    // Compute the optimistic delta: if we're toggling the same vote off,
    // undo it; if we're switching or voting fresh, apply the difference.
    const previousVote = myVote;
    const delta =
      previousVote === voteValue
        ? -voteValue
        : voteValue - (previousVote ?? 0);

    setNetVotes((v) => v + delta);
    setMyVote(previousVote === voteValue ? null : voteValue);

    const response = await fetch(`/api/forum/${postId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteValue }),
    });

    if (!response.ok) {
      // Roll back on failure.
      setNetVotes((v) => v - delta);
      setMyVote(previousVote);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => castVote(1)}
        aria-label="Upvote"
        aria-pressed={myVote === 1}
        className={myVote === 1 ? "text-brand-600" : "text-slate-400 hover:text-slate-600"}
      >
        ▲
      </button>
      <span className="text-sm font-medium">{netVotes}</span>
      <button
        onClick={() => castVote(-1)}
        aria-label="Downvote"
        aria-pressed={myVote === -1}
        className={myVote === -1 ? "text-red-500" : "text-slate-400 hover:text-slate-600"}
      >
        ▼
      </button>
    </div>
  );
}
