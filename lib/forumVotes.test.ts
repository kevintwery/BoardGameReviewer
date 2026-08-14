import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    $executeRaw: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { recalculateForumPostVoteScore } from "@/lib/forumVotes";

describe("recalculateForumPostVoteScore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues exactly one atomic SQL statement, not a separate read-then-write", async () => {
    await recalculateForumPostVoteScore("post_1");

    expect(db.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it("scopes the update to the given postId", async () => {
    await recalculateForumPostVoteScore("post_42");

    const callArgs = (db.$executeRaw as any).mock.calls[0];
    expect(callArgs).toContain("post_42");
  });
});
