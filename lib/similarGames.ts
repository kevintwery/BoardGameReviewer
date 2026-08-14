import { db } from "@/lib/db";
import type { Game } from "@prisma/client";

export type ComplexityDirection = "simpler" | "harder" | "any";

/**
 * Finds games similar to `game`, based on how many categories/mechanics
 * they share. This is a simple overlap-count approach rather than a full
 * recommendation model — good enough for v1, and cheap to compute since
 * our game catalog is small (thousands, not millions, of rows).
 *
 * @param game               The game to find matches for.
 * @param complexityDirection Optionally restrict results to games that are
 *                             simpler or harder than `game`, based on BGG's
 *                             weight score. Defaults to "any".
 * @param limit               Max number of results to return.
 */
export async function findSimilarGames(
  game: Pick<Game, "id" | "categories" | "mechanics" | "bggWeight">,
  complexityDirection: ComplexityDirection = "any",
  limit = 6
): Promise<Game[]> {
  // Postgres array overlap: hasSome matches rows sharing at least one
  // element with the given array. We fetch a slightly larger candidate
  // pool than we need, then rank by overlap count in JS, since Prisma
  // doesn't expose "count of overlapping array elements" directly.
  const candidates = await db.game.findMany({
    where: {
      id: { not: game.id },
      OR: [
        { categories: { hasSome: game.categories } },
        { mechanics: { hasSome: game.mechanics } },
      ],
      ...(complexityDirection === "simpler" && { bggWeight: { lt: game.bggWeight } }),
      ...(complexityDirection === "harder" && { bggWeight: { gt: game.bggWeight } }),
    },
    take: limit * 4, // over-fetch candidates so ranking below has room to work with
  });

  const withOverlapScore = candidates.map((candidate) => {
    const sharedCategories = candidate.categories.filter((c) =>
      game.categories.includes(c)
    ).length;
    const sharedMechanics = candidate.mechanics.filter((m) =>
      game.mechanics.includes(m)
    ).length;

    return { candidate, overlapScore: sharedCategories + sharedMechanics };
  });

  return withOverlapScore
    .sort((a, b) => b.overlapScore - a.overlapScore)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
