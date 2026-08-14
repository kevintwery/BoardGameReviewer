import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { findSimilarGames } from "@/lib/similarGames";
import { HeroBanner } from "@/components/games/HeroBanner";
import { VideoRow } from "@/components/games/VideoRow";
import { SimilarGames } from "@/components/games/SimilarGames";
import { RatingForm } from "@/components/games/RatingForm";
import { AddToListButton } from "@/components/lists/AddToListButton";
import { RulesSummary } from "@/components/games/RulesSummary";

interface GamePageProps {
  params: { slug: string };
}

// Revalidate every 5 minutes. A game's ratings/videos/forum activity
// change often enough that a fully static page would feel stale, but
// rarely enough (compared to page views) that re-querying Postgres on
// every single visit is wasted work. Next.js serves the cached HTML
// instantly and refreshes it in the background after this window,
// rather than blocking a visitor's request on a fresh database query.
export const revalidate = 300;

// Runs at request time to build a per-game <title>/description and Open
// Graph tags — this is what makes a shared game link show the actual box
// art and name in Slack/Discord/iMessage previews instead of the generic
// site-wide fallback in app/layout.tsx.
export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const game = await db.game.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true, imageUrl: true },
  });

  if (!game) return {};

  const description = `${game.description.slice(0, 155)}…`;

  return {
    title: game.name,
    description,
    openGraph: {
      title: game.name,
      description,
      images: [{ url: game.imageUrl }],
    },
  };
}

// This is a Server Component (no "use client"), so the Prisma query below
// runs on the server at request time — the browser never sees database
// credentials or query logic, only the finished HTML/data.
export default async function GamePage({ params }: GamePageProps) {
  const game = await db.game.findUnique({
    where: { slug: params.slug },
    include: {
      videos: { orderBy: { sortOrder: "asc" } },
    },
  });

  // Next.js convention: calling notFound() renders the nearest not-found.tsx
  // (or the default 404 page) instead of crashing or showing a blank page.
  if (!game) {
    notFound();
  }

  const similarGames = await findSimilarGames(game);

  const topRuleClarifications = await db.forumPost.findMany({
    where: { gameId: game.id, category: "RULE_CLARIFICATION", isHidden: false },
    take: 20, // over-fetch since we rank by vote score below, not in the DB query
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <HeroBanner
        name={game.name}
        imageUrl={game.imageUrl}
        avgRating={game.avgRating}
        ratingCount={game.ratingCount}
        minPlayers={game.minPlayers}
        maxPlayers={game.maxPlayers}
        playingTime={game.playingTime}
      />

      <div className="mt-4 flex justify-end">
        <SignedIn>
          <AddToListButton gameId={game.id} />
        </SignedIn>
        <SignedOut>
          <SignInButton>
            <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              Sign in to add to a list
            </button>
          </SignInButton>
        </SignedOut>
      </div>

      <p className="mt-6 text-slate-700 dark:text-slate-300">{game.description}</p>

      <VideoRow videos={game.videos} />

      <SimilarGames games={similarGames} />

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Rate This Game</h2>
        <div className="mt-3">
          <SignedIn>
            <RatingForm gameId={game.id} />
          </SignedIn>
          <SignedOut>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <SignInButton>
                <button className="font-medium text-brand-600 hover:underline dark:text-brand-500">
                  Sign in
                </button>
              </SignInButton>{" "}
              to leave a rating.
            </p>
          </SignedOut>
        </div>
      </section>

      <RulesSummary gameName={game.name} bggId={game.bggId} posts={topRuleClarifications} />

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Forum</h2>
          <Link
            href={`/games/${game.slug}/forum`}
            className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-500"
          >
            View all discussions →
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Rule clarifications, house rules, and strategy discussion for {game.name}.
        </p>
      </section>
    </main>
  );
}
