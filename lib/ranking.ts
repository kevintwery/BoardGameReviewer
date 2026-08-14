/**
 * Forum post ranking ("Reddit-style" hot score).
 *
 * The goal: a post with lots of votes should rank higher, but a slightly
 * older post with more votes shouldn't bury a great new post forever. We
 * balance that by combining net votes with how long ago the post was made.
 *
 * This is intentionally simple to start. If the forum grows large enough
 * that this feels too crude, the usual next step is Reddit's actual "hot"
 * algorithm (log-scaled votes + a time-based offset) — but net votes with
 * a decay factor is easy to read and reason about, which matters more at
 * this stage than being clever.
 */

const GRAVITY = 1.5; // higher = older posts fall out of "hot" faster
const HOURS_IN_MS = 1000 * 60 * 60;

export interface RankablePost {
  netVotes: number; // sum of ForumVote.voteValue for this post
  createdAt: Date;
}

/**
 * Returns a score where higher = should rank higher on the "Top" /
 * "Helpful" sort. Callers sort their post list by this value, descending.
 */
export function calculateHotScore(post: RankablePost): number {
  const ageInHours = (Date.now() - post.createdAt.getTime()) / HOURS_IN_MS;

  // +1 keeps the denominator from hitting zero for brand-new posts, and
  // keeps a post with 0 net votes from scoring the same as a post with
  // negative votes.
  const score = (post.netVotes + 1) / Math.pow(ageInHours + 2, GRAVITY);

  return score;
}

/**
 * Convenience helper for sorting an array of posts by hot score,
 * highest first. Does not mutate the input array.
 */
export function sortByHotScore<T extends RankablePost>(posts: T[]): T[] {
  return [...posts].sort((a, b) => calculateHotScore(b) - calculateHotScore(a));
}
