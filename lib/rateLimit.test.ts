import { describe, it, expect } from "vitest";
import { checkRateLimit, enforceRateLimit } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit", () => {
    const key = `test-allow-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000).success).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    const key = `test-block-${Math.random()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);

    const third = checkRateLimit(key, 2, 60_000);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("resets the count after the window passes", () => {
    const key = `test-reset-${Math.random()}`;
    // A 1ms window so the test doesn't need to sleep for real — by the
    // time we call again, Date.now() has already passed resetAt.
    checkRateLimit(key, 1, 1);
    checkRateLimit(key, 1, 1); // this would fail if the window hadn't passed

    // Give the 1ms window time to elapse.
    const start = Date.now();
    while (Date.now() - start < 5) {
      /* busy-wait a few ms — fine for a test, never do this in app code */
    }

    const afterReset = checkRateLimit(key, 1, 1);
    expect(afterReset.success).toBe(true);
  });

  it("tracks independent buckets per key", () => {
    const keyA = `test-independent-a-${Math.random()}`;
    const keyB = `test-independent-b-${Math.random()}`;

    checkRateLimit(keyA, 1, 60_000);
    const bBucketFirstCall = checkRateLimit(keyB, 1, 60_000);

    expect(bBucketFirstCall.success).toBe(true);
  });
});

describe("enforceRateLimit", () => {
  it("returns null when the user is under their limit", () => {
    const result = enforceRateLimit(`test-enforce-ok-${Math.random()}`, "forumVote");
    expect(result).toBeNull();
  });

  it("returns an error object with a retry time once the limit is exceeded", () => {
    const userId = `test-enforce-block-${Math.random()}`;
    // "report" has a limit of 10 per hour — exhaust it.
    for (let i = 0; i < 10; i++) {
      enforceRateLimit(userId, "report");
    }

    const blocked = enforceRateLimit(userId, "report");

    expect(blocked).not.toBeNull();
    expect(blocked?.error).toMatch(/too many requests/i);
    expect(blocked?.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps separate limits per action for the same user", () => {
    const userId = `test-enforce-separate-${Math.random()}`;

    // Exhaust the "forumPost" limit (5/min) but "forumComment" (15/min)
    // should be untouched since they're tracked independently.
    for (let i = 0; i < 5; i++) {
      enforceRateLimit(userId, "forumPost");
    }
    const postBlocked = enforceRateLimit(userId, "forumPost");
    const commentStillAllowed = enforceRateLimit(userId, "forumComment");

    expect(postBlocked).not.toBeNull();
    expect(commentStillAllowed).toBeNull();
  });
});
