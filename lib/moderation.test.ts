import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    forumPost: { update: vi.fn() },
    forumComment: { update: vi.fn() },
  },
}));

import { db } from "@/lib/db";
import { isModerator, hideContent } from "@/lib/moderation";

describe("isModerator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true for a MODERATOR", async () => {
    (db.user.findUnique as any).mockResolvedValue({ role: "MODERATOR" });
    expect(await isModerator("user_1")).toBe(true);
  });

  it("returns true for an ADMIN", async () => {
    (db.user.findUnique as any).mockResolvedValue({ role: "ADMIN" });
    expect(await isModerator("user_1")).toBe(true);
  });

  it("returns false for a plain USER", async () => {
    (db.user.findUnique as any).mockResolvedValue({ role: "USER" });
    expect(await isModerator("user_1")).toBe(false);
  });

  it("returns false when the user doesn't exist", async () => {
    (db.user.findUnique as any).mockResolvedValue(null);
    expect(await isModerator("nonexistent_user")).toBe(false);
  });
});

describe("hideContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides a post via forumPost.update when contentType is POST", async () => {
    await hideContent("POST", "post_1");

    expect(db.forumPost.update).toHaveBeenCalledWith({
      where: { id: "post_1" },
      data: { isHidden: true },
    });
    expect(db.forumComment.update).not.toHaveBeenCalled();
  });

  it("hides a comment via forumComment.update when contentType is COMMENT", async () => {
    await hideContent("COMMENT", "comment_1");

    expect(db.forumComment.update).toHaveBeenCalledWith({
      where: { id: "comment_1" },
      data: { isHidden: true },
    });
    expect(db.forumPost.update).not.toHaveBeenCalled();
  });
});
