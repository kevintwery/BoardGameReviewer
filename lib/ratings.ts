import { db } from "@/lib/db";

/**
 * Recalculates and saves a game's average rating and rating count.
 *
 * We store `avgRating`/`ratingCount` directly on the Game row (instead of
 * computing them fresh from the Rating table on every page view) so that
 * sorting the game list by rating is a fast, indexed column sort. The
 * tradeoff is that we must remember to call this function any time a
 * rating is created, updated, or deleted — every API route that touches
 * Rating should call this afterward.
 *
 * This runs as a single atomic UPDATE (aggregate computed in a subquery,
 * not a separate round trip) rather than "SELECT the aggregate, then
 * UPDATE with what we read." The two-step version has a real race: if
 * two people rate the same game at nearly the same moment, both
 * recalculations could read the aggregate before either writes, and
 * whichever write lands second overwrites the first with a stale count
 * — a classic lost update. Folding the SELECT into the UPDATE closes
 * that window: Postgres serializes concurrent UPDATEs to the same row,
 * so whichever statement runs last always computes its aggregate fresh
 * from the database's current state, not from a value read earlier in
 * a separate query.
 */
export async function recalculateGameRatingStats(gameId: string): Promise<void> {
  await db.$executeRaw`
    UPDATE "Game"
    SET "avgRating" = COALESCE((SELECT AVG("overallScore") FROM "Rating" WHERE "gameId" = ${gameId}), 0),
        "ratingCount" = (SELECT COUNT(*) FROM "Rating" WHERE "gameId" = ${gameId})
    WHERE id = ${gameId}
  `;
}
