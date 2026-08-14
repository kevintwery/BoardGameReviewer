import Link from "next/link";
import { sortByHotScore } from "@/lib/ranking";

interface ForumPostWithVotes {
  id: string;
  title: string;
  voteScore: number;
  createdAt: Date;
}

interface RulesSummaryProps {
  gameName: string;
  bggId: number;
  posts: ForumPostWithVotes[];
}

/**
 * Quick-reference panel for rules: a link out to BGG's own rulebook page
 * (we don't reproduce rulebook text ourselves — copyright, and BGG
 * already hosts it), plus the site's own top-voted rule-clarification
 * threads, which are often more useful than the rulebook for edge cases.
 */
export function RulesSummary({ gameName, bggId, posts }: RulesSummaryProps) {
  const topPosts = sortByHotScore(
    posts.map((post) => ({
      ...post,
      netVotes: post.voteScore,
    }))
  ).slice(0, 5);

  return (
    <section className="mt-8 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <h2 className="text-xl font-semibold">Rules Reference</h2>

      <a
        href={`https://boardgamegeek.com/boardgame/${bggId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-500"
      >
        Official rulebook on BoardGameGeek →
      </a>

      {topPosts.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Top rule clarifications from the community
          </p>
          <ul className="mt-2 space-y-1">
            {topPosts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/forum/posts/${post.id}`}
                  className="text-sm text-brand-600 hover:underline dark:text-brand-500"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {topPosts.length === 0 && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          No rule clarification threads for {gameName} yet.
        </p>
      )}
    </section>
  );
}
