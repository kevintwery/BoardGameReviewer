import Image from "next/image";
import Link from "next/link";

interface ShelfViewProps {
  games: Array<{ id: string; slug: string; name: string; imageUrl: string }>;
}

/**
 * Renders a list's games as a box-art grid, like a physical shelf. Used
 * for the "Games I Own" list (GameList.isOwnedList) instead of the
 * standard row layout — people like seeing their collection this way,
 * and it reads more like a shelf than a spreadsheet.
 */
export function ShelfView({ games }: ShelfViewProps) {
  if (games.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Nothing on the shelf yet — add a game you own from its page.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {games.map((game) => (
        <Link key={game.id} href={`/games/${game.slug}`} className="group">
          <div className="relative aspect-square overflow-hidden rounded-md shadow-sm">
            <Image
              src={game.imageUrl}
              alt={game.name}
              fill
              className="object-cover transition group-hover:scale-105"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
