"use client";

import { useEffect, useState } from "react";
import { StarInput } from "@/components/games/StarInput";

interface RatingFormProps {
  gameId: string;
  // Called after a successful save so the parent page can refresh the
  // displayed average rating without a full page reload.
  onSaved?: () => void;
}

interface ExistingRating {
  overallScore: number;
  funScore: number | null;
  replayScore: number | null;
  componentScore: number | null;
  complexityScore: number | null;
  reviewText: string | null;
}

const EMPTY_RATING: ExistingRating = {
  overallScore: 0,
  funScore: null,
  replayScore: null,
  componentScore: null,
  complexityScore: null,
  reviewText: null,
};

/**
 * Lets a signed-in user rate a game: a required overall score plus
 * optional sub-ratings (fun, replayability, components) and their own
 * complexity score. Loads the user's existing rating on mount, if any,
 * so re-visiting a game they already rated shows their previous answer
 * instead of a blank form.
 */
export function RatingForm({ gameId, onSaved }: RatingFormProps) {
  const [rating, setRating] = useState<ExistingRating>(EMPTY_RATING);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExistingRating() {
      const response = await fetch(`/api/ratings?gameId=${gameId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.rating) setRating(data.rating);
      }
      setIsLoading(false);
    }
    loadExistingRating();
  }, [gameId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating.overallScore < 1) {
      setSaveError("Please choose an overall rating before saving.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const response = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, ...rating }),
    });

    setIsSaving(false);

    if (!response.ok) {
      setSaveError("Something went wrong saving your rating. Please try again.");
      return;
    }

    onSaved?.();
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading your rating…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <StarInput
        label="Overall rating"
        max={10}
        value={rating.overallScore}
        onChange={(value) => setRating((r) => ({ ...r, overallScore: value }))}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StarInput
          label="Fun"
          max={5}
          value={rating.funScore ?? 0}
          onChange={(value) => setRating((r) => ({ ...r, funScore: value }))}
        />
        <StarInput
          label="Replayability"
          max={5}
          value={rating.replayScore ?? 0}
          onChange={(value) => setRating((r) => ({ ...r, replayScore: value }))}
        />
        <StarInput
          label="Components"
          max={5}
          value={rating.componentScore ?? 0}
          onChange={(value) => setRating((r) => ({ ...r, componentScore: value }))}
        />
      </div>

      <div>
        <StarInput
          label="How hard was it to learn/play? (your own complexity score)"
          max={5}
          value={rating.complexityScore ?? 0}
          onChange={(value) => setRating((r) => ({ ...r, complexityScore: value }))}
        />
      </div>

      <div>
        <label htmlFor="reviewText" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Review (optional)
        </label>
        <textarea
          id="reviewText"
          value={rating.reviewText ?? ""}
          onChange={(e) => setRating((r) => ({ ...r, reviewText: e.target.value }))}
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          placeholder="What did you think?"
        />
      </div>

      {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save rating"}
      </button>
    </form>
  );
}
