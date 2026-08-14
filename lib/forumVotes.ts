import { db } from "@/lib/db";

/**
 * Recalculates and saves a forum post's denormalized vote score.
 *
 * Same pattern as recalculateGameRatingStats in lib/ratings.ts, including
 * the same fix: this runs as a single atomic UPDATE with the aggregate
 * computed in a subquery, rather than a separate SELECT-then-UPDATE round
 * trip. See the comment in lib/ratings.ts for the concurrent-write race
 * this closes — voting is exactly the kind of action where two people
 * clicking a button on the same popular post at the same moment isn't
 * an edge case, it's a Tuesday.
 */
export async function recalculateForumPostVoteScore(postId: string): Promise<void> {
  await db.$executeRaw`
    UPDATE "ForumPost"
    SET "voteScore" = COALESCE((SELECT SUM("voteValue") FROM "ForumVote" WHERE "postId" = ${postId}), 0)
    WHERE id = ${postId}
  `;
}
