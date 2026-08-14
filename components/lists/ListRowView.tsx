import Image from "next/image";
import Link from "next/link";

interface ListRowViewProps {
  games: Array<{ id: string; slug: string; name: string; imageUrl: string; avgRating: number }>;
}

/**
 * Standard row layout for a list's games — used for every list except
 * "Games I Own", which gets the box-art ShelfView instead.
 */
export function ListRowView({ games }: ListRowViewProps) {
  if (games.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        This list is empty — add a game from its page.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
      {games.map((game) => (
        <li key={game.id}>
          <Link
            href={`/games/${game.slug}`}
            className="flex items-center gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
              <Image src={game.imageUrl} alt={game.name} fill className="object-cover" />
            </div>
            <div>
              <p className="font-medium">{game.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                ★ {game.avgRating.toFixed(1)}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
