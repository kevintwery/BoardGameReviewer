/**
 * A small in-memory rate limiter for write endpoints (ratings, forum
 * posts/comments/votes, reports). It stops the obvious cases — a script
 * hammering an endpoint, a bug in a client retry loop — without pulling
 * in an external dependency for a project this size.
 *
 * IMPORTANT LIMITATION: this state lives in the memory of a single
 * server process. On Vercel (serverless), each function invocation can
 * land on a different instance with its own memory, so a determined
 * abuser spread across enough requests could exceed these limits in
 * practice. This is fine for "stop accidental abuse and obvious bots"
 * but is NOT a substitute for a shared store once real abuse shows up.
 *
 * Upgrading later is a one-file change: swap the body of
 * `checkRateLimit` for a call to `@upstash/ratelimit` (Redis-backed,
 * works correctly across serverless instances) — the function signature
 * below is deliberately kept small so callers don't need to change.
 */

interface RateLimitResult {
  success: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Unix ms timestamp when the window resets. */
  resetAt: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so this Map doesn't grow forever on
// a long-lived server process. Not critical (each bucket is tiny), but
// cheap insurance.
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS).unref?.();

/**
 * Checks and consumes one "request" from the caller's rate limit bucket.
 *
 * @param key       Unique identifier for who/what is being limited —
 *                   typically `${userId}:${action}`, e.g. "user_abc:forumPost".
 * @param limit     Max requests allowed per window.
 * @param windowMs  Window length in milliseconds.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

// Centralized so every route uses the same numbers — tune these here
// rather than hunting through individual route files.
export const RATE_LIMITS = {
  rating: { limit: 20, windowMs: 60_000 }, // 20 rating saves per minute
  forumPost: { limit: 5, windowMs: 60_000 }, // 5 new posts per minute
  forumComment: { limit: 15, windowMs: 60_000 }, // 15 replies per minute
  forumVote: { limit: 60, windowMs: 60_000 }, // 60 votes per minute (voting is low-stakes, allow more)
  report: { limit: 10, windowMs: 60 * 60_000 }, // 10 reports per hour
  listCreate: { limit: 20, windowMs: 60_000 },
  listItem: { limit: 60, windowMs: 60_000 },
  bggImport: { limit: 30, windowMs: 60_000 }, // admin action, but still avoid hammering BGG
} as const;

/**
 * Convenience wrapper for the common case in an API route: check the
 * named limit for this user, and get back either `null` (proceed) or a
 * ready-to-return 429 response.
 *
 * ```ts
 * const limited = enforceRateLimit(userId, "forumPost");
 * if (limited) return limited;
 * ```
 */
export function enforceRateLimit(userId: string, action: keyof typeof RATE_LIMITS) {
  const { limit, windowMs } = RATE_LIMITS[action];
  const result = checkRateLimit(`${userId}:${action}`, limit, windowMs);

  if (result.success) return null;

  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return {
    error: "Too many requests. Please slow down and try again shortly.",
    retryAfterSeconds,
  };
}
