import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { SearchBox } from "@/components/games/SearchBox";
import { SortControls } from "@/components/games/SortControls";
import type { GameSummary } from "@/lib/types";

const PAGE_SIZE = 20;

interface GamesPageProps {
  // Sort/page state lives in the URL (not just localStorage) so links to
  // a specific sorted/paginated view are shareable and work with the
  // browser back button. lib/filterPersistence.ts separately remembers a
  // user's last choice to redirect them here with the right params.
  searchParams: {
    sort?: "name" | "rating" | "type";
    order?: "asc" | "desc";
    page?: string;
  };
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const sort = searchParams.sort ?? "rating";
  const order = searchParams.order ?? "desc";
  const page = Number(searchParams.page ?? "1");

  const orderBy = sort === "rating" ? { avgRating: order } : { name: order };

  const [games, totalCount] = await Promise.all([
    db.game.findMany({
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.game.count(),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold">Browse Games</h1>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox />
        <SortControls currentSort={sort} currentOrder={order} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {games.map((game: GameSummary) => (
          <Link key={game.id} href={`/games/${game.slug}`} className="group">
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={game.imageUrl}
                alt={game.name}
                fill
                className="object-cover transition group-hover:scale-105"
              />
            </div>
            <p className="mt-1 truncate text-sm font-medium">{game.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ★ {game.avgRating.toFixed(1)} ({game.ratingCount})
            </p>
          </Link>
        ))}
      </div>

      {games.length === 0 && (
        <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
          No games yet — run the BGG sync to populate the catalog.
        </p>
      )}

      <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Pagination">
        {page > 1 && (
          <Link
            href={`/games?sort=${sort}&order=${order}&page=${page - 1}`}
            className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-500"
          >
            ← Previous
          </Link>
        )}
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        {page < totalPages && (
          <Link
            href={`/games?sort=${sort}&order=${order}&page=${page + 1}`}
            className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-500"
          >
            Next →
          </Link>
        )}
      </nav>
    </main>
  );
}
