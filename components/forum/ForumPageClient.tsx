"use client";

import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { PostCard } from "@/components/forum/PostCard";
import { NewPostForm } from "@/components/forum/NewPostForm";
import { sortByHotScore } from "@/lib/ranking";

interface ForumPageClientProps {
  gameId: string;
  gameName: string;
}

type CategoryFilter = "ALL" | "RULE_CLARIFICATION" | "HOUSE_RULES" | "STRATEGY";

const FILTERS: Array<{ value: CategoryFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "RULE_CLARIFICATION", label: "Rule Clarification" },
  { value: "HOUSE_RULES", label: "House Rules" },
  { value: "STRATEGY", label: "Strategy" },
];

/**
 * This is a client component (rather than a server component like the
 * other pages) because the "hot score" ranking depends on the current
 * time, and because filtering by category feels snappier without a full
 * page navigation. The data itself still comes from our own API route,
 * not straight from the database.
 */
export function ForumPageClient({ gameId, gameName }: ForumPageClientProps) {
  const [posts, setPosts] = useState<any[] | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>("ALL");
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  // Bumping this forces the effect below to re-run and refetch — used
  // after creating a new post, since the post list itself doesn't change
  // identity in a way React would notice on its own.
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    async function loadPosts() {
      const url =
        filter === "ALL"
          ? `/api/forum?gameId=${gameId}`
          : `/api/forum?gameId=${gameId}&category=${filter}`;
      const response = await fetch(url);
      const data = await response.json();
      setPosts(data.posts);
    }
    loadPosts();
  }, [gameId, filter, refreshCount]);

  const sortedPosts = posts
    ? sortByHotScore(
        posts.map((post) => ({
          ...post,
          netVotes: post.voteScore,
          createdAt: new Date(post.createdAt),
        }))
      )
    : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold">{gameName} Forum</h1>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={
                filter === f.value
                  ? "rounded-full bg-brand-500 px-3 py-1 text-sm text-white"
                  : "rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <SignedIn>
          <button
            onClick={() => setShowNewPostForm((v) => !v)}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            New post
          </button>
        </SignedIn>
        <SignedOut>
          <SignInButton>
            <button className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-500">
              Sign in to post
            </button>
          </SignInButton>
        </SignedOut>
      </div>

      {showNewPostForm && (
        <div className="mt-4">
          <NewPostForm
            gameId={gameId}
            onCreated={() => {
              setShowNewPostForm(false);
              setRefreshCount((count) => count + 1);
            }}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {posts === null && <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>}
        {posts !== null && sortedPosts.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No posts yet in this category — be the first to start a discussion.
          </p>
        )}
        {sortedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
}
