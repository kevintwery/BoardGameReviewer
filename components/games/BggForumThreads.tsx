import type { BggForum } from "@/lib/bgg/client";

interface BggForumThreadsProps {
  bggId: number;
  // null when BGG couldn't be reached — we still show the link out.
  forums: BggForum[] | null;
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * Recent threads from the game's Rules and Strategy forums on
 * BoardGameGeek. Titles only, linking out to BGG — the discussions
 * themselves stay there.
 */
export function BggForumThreads({ bggId, forums }: BggForumThreadsProps) {
  const allForumsUrl = `https://boardgamegeek.com/boardgame/${bggId}/forums`;
  const hasThreads = forums?.some((forum) => forum.threads.length > 0);

  return (
    <section className="mt-8 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">From BoardGameGeek</h2>
        <a
          href={allForumsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-500"
        >
          All BGG forums →
        </a>
      </div>

      {hasThreads ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {forums!
            .filter((forum) => forum.threads.length > 0)
            .map((forum) => (
              <div key={forum.id}>
                <a
                  href={forum.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-slate-700 hover:underline dark:text-slate-300"
                >
                  {forum.title}
                </a>
                <ul className="mt-2 space-y-2">
                  {forum.threads.map((thread) => (
                    <li key={thread.id}>
                      <a
                        href={thread.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 hover:underline dark:text-brand-500"
                      >
                        {thread.subject}
                      </a>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {thread.author} · {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
                        {thread.lastPostDate && ` · ${dateFormat.format(thread.lastPostDate)}`}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {forums === null
            ? "Couldn't load BoardGameGeek's forums right now."
            : "No rules or strategy threads on BoardGameGeek yet."}
        </p>
      )}
    </section>
  );
}
