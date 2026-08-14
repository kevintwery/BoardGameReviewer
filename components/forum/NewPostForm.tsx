"use client";

import { useState } from "react";

interface NewPostFormProps {
  gameId: string;
  onCreated: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "RULE_CLARIFICATION", label: "Rule Clarification" },
  { value: "HOUSE_RULES", label: "House Rules" },
  { value: "STRATEGY", label: "Strategy" },
] as const;

export function NewPostForm({ gameId, onCreated }: NewPostFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]["value"]>(
    "RULE_CLARIFICATION"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      setError("Please fill in both a title and a description.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, title, body, category }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Something went wrong creating your post. Please try again.");
      return;
    }

    setTitle("");
    setBody("");
    onCreated();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700"
    >
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof category)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            category === "RULE_CLARIFICATION"
              ? "e.g. Can you re-draw if your starting hand has no birds?"
              : "Give your post a clear title"
          }
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Details
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {isSubmitting ? "Posting…" : "Post"}
      </button>
    </form>
  );
}
