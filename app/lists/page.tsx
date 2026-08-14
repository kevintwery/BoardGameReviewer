import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// This route is already gated by middleware.ts (see the isProtectedRoute
// matcher for "/lists(.*)"), so by the time this component runs we know
// the visitor is signed in.
export default async function ListsPage() {
  const { userId } = await auth();

  const lists = await db.gameList.findMany({
    where: { userId: userId! },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: { items: { include: { game: true } } },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold">My Lists</h1>

      <div className="mt-6 space-y-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/lists/${list.id}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <span className="font-medium">{list.name}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {list.items.length} {list.items.length === 1 ? "game" : "games"}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
