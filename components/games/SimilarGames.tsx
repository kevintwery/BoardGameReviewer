import Image from "next/image";
import Link from "next/link";

interface SimilarGamesProps {
  games: Array<{
    id: string;
    slug: string;
    name: string;
    imageUrl: string;
    avgRating: number;
  }>;
}

/**
 * "You might also like" row. The simpler/harder filtering happens
 * server-side (see lib/similarGames.ts) — this component just renders
 * whatever list it's given, so it works the same whether the parent page
 * asked for "any", "simpler", or "harder" matches.
 */
export function SimilarGames({ games }: SimilarGamesProps) {
  if (games.length === 0) return null;

  return (
    <section aria-label="Similar games" className="mt-8">
      <h2 className="text-xl font-semibold">You Might Also Like</h2>

      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {games.map((game) => (
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
              ★ {game.avgRating.toFixed(1)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
