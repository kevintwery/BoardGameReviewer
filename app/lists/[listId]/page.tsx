import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ShelfView } from "@/components/lists/ShelfView";
import { ListRowView } from "@/components/lists/ListRowView";

interface ListDetailPageProps {
  params: { listId: string };
}

export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const { userId } = await auth();

  const list = await db.gameList.findUnique({
    where: { id: params.listId },
    include: { items: { include: { game: true } } },
  });

  // Not found covers both "list doesn't exist" and "list belongs to
  // someone else" — we don't want to leak which lists exist by giving a
  // different error for each case.
  if (!list || list.userId !== userId) {
    notFound();
  }

  const games = list.items.map((item) => item.game);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold">{list.name}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {games.length} {games.length === 1 ? "game" : "games"}
        {list.isPublic ? " · Public" : " · Private"}
      </p>

      <div className="mt-6">
        {list.isOwnedList ? <ShelfView games={games} /> : <ListRowView games={games} />}
      </div>
    </main>
  );
}
