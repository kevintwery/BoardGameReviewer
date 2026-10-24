import { db } from "@/lib/db";

export type GameSort = "name" | "rating" | "weight";
export type SortOrder = "asc" | "desc";

const GAME_SORTS: readonly GameSort[] = ["name", "rating", "weight"];

/** Falls back to rating for missing or stale values (e.g. old ?sort=type links). */
export function parseGameSort(value: string | undefined): GameSort {
  return GAME_SORTS.includes(value as GameSort) ? (value as GameSort) : "rating";
}

export function parseSortOrder(value: string | undefined): SortOrder {
  return value === "asc" ? "asc" : "desc";
}

/**
 * Fetches one page of the browse grid in the requested order.
 *
 * Weight needs special handling: BGG reports 0 for games nobody has
 * voted on, and a plain ascending sort would put all of those first as
 * if they were the lightest games. Instead, games with a known weight
 * are paged through first (in either direction) and unknown-weight
 * games always come last, alphabetically.
 */
export async function findGamesPage({
  sort,
  order,
  page,
  pageSize,
}: {
  sort: GameSort;
  order: SortOrder;
  page: number;
  pageSize: number;
}) {
  const skip = (page - 1) * pageSize;

  if (sort !== "weight") {
    const orderBy = sort === "rating" ? { avgRating: order } : { name: order };
    return db.game.findMany({ orderBy, skip, take: pageSize });
  }

  const knownWeightCount = await db.game.count({ where: { bggWeight: { gt: 0 } } });

  const knownWeightGames =
    skip < knownWeightCount
      ? await db.game.findMany({
          where: { bggWeight: { gt: 0 } },
          orderBy: [{ bggWeight: order }, { name: "asc" }],
          skip,
          take: pageSize,
        })
      : [];

  const remaining = pageSize - knownWeightGames.length;
  if (remaining === 0) return knownWeightGames;

  const unknownWeightGames = await db.game.findMany({
    where: { bggWeight: { lte: 0 } },
    orderBy: { name: "asc" },
    skip: Math.max(0, skip - knownWeightCount),
    take: remaining,
  });

  return [...knownWeightGames, ...unknownWeightGames];
}
