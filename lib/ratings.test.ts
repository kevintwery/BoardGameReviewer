import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocking lib/db means these tests exercise the real logic in
// lib/ratings.ts — specifically, that it issues a single atomic SQL
// statement rather than a separate read-then-write — without needing an
// actual Postgres connection.
vi.mock("@/lib/db", () => ({
  db: {
    $executeRaw: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { recalculateGameRatingStats } from "@/lib/ratings";

describe("recalculateGameRatingStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues exactly one atomic SQL statement, not a separate read-then-write", async () => {
    await recalculateGameRatingStats("game_1");

    // The whole point of this function is that it's a single round trip
    // — asserting call count is what actually protects against someone
    // "refactoring" it back into the racy two-step version later.
    expect(db.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it("scopes the update to the given gameId", async () => {
    await recalculateGameRatingStats("game_42");

    // $executeRaw is called as a tagged template: the game id we passed
    // in appears as an interpolated value alongside the SQL string parts.
    const callArgs = (db.$executeRaw as any).mock.calls[0];
    expect(callArgs).toContain("game_42");
  });
});
