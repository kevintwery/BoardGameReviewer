import { describe, it, expect } from "vitest";
import { calculateHotScore, sortByHotScore, type RankablePost } from "@/lib/ranking";

// These tests exist mainly to catch silent regressions in the ranking
// math — it's the kind of code where a sign error or an off-by-one in
// the gravity exponent produces plausible-looking-but-wrong output that
// nobody notices until someone asks "why is this old post still on top?"

describe("calculateHotScore", () => {
  it("scores a post with more net votes higher than one with fewer, at the same age", () => {
    const now = new Date();
    const popular: RankablePost = { netVotes: 50, createdAt: now };
    const unpopular: RankablePost = { netVotes: 2, createdAt: now };

    expect(calculateHotScore(popular)).toBeGreaterThan(calculateHotScore(unpopular));
  });

  it("scores a newer post higher than an older post with the same net votes", () => {
    const newPost: RankablePost = { netVotes: 10, createdAt: new Date() };
    const oldPost: RankablePost = {
      netVotes: 10,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    };

    expect(calculateHotScore(newPost)).toBeGreaterThan(calculateHotScore(oldPost));
  });

  it("never divides by zero for a brand-new post with zero votes", () => {
    const brandNew: RankablePost = { netVotes: 0, createdAt: new Date() };
    expect(Number.isFinite(calculateHotScore(brandNew))).toBe(true);
  });

  it("scores a post with negative net votes lower than a neutral post", () => {
    const now = new Date();
    const downvoted: RankablePost = { netVotes: -5, createdAt: now };
    const neutral: RankablePost = { netVotes: 0, createdAt: now };

    expect(calculateHotScore(downvoted)).toBeLessThan(calculateHotScore(neutral));
  });
});

describe("sortByHotScore", () => {
  it("orders posts highest score first", () => {
    const now = new Date();
    const posts: RankablePost[] = [
      { netVotes: 1, createdAt: now },
      { netVotes: 100, createdAt: now },
      { netVotes: 10, createdAt: now },
    ];

    const sorted = sortByHotScore(posts);
    expect(sorted.map((p) => p.netVotes)).toEqual([100, 10, 1]);
  });

  it("does not mutate the input array", () => {
    const posts: RankablePost[] = [
      { netVotes: 1, createdAt: new Date() },
      { netVotes: 5, createdAt: new Date() },
    ];
    const original = [...posts];

    sortByHotScore(posts);

    expect(posts).toEqual(original);
  });
});
