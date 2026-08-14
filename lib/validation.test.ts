import { describe, it, expect } from "vitest";
import { ratingSchema, forumPostSchema, forumCommentSchema, reportSchema } from "@/lib/validation";

// These schemas are the real security boundary on every write route —
// if one of them is wrong (too permissive, or rejects valid input), it's
// either a hole an attacker can drive through or a bug that breaks a
// legitimate user's rating/post. Worth testing directly rather than only
// exercising them indirectly through the API routes.

describe("ratingSchema", () => {
  it("accepts a minimal valid rating", () => {
    const result = ratingSchema.safeParse({ gameId: "game_1", overallScore: 7 });
    expect(result.success).toBe(true);
  });

  it("rejects an overallScore outside 1-10", () => {
    expect(ratingSchema.safeParse({ gameId: "game_1", overallScore: 0 }).success).toBe(false);
    expect(ratingSchema.safeParse({ gameId: "game_1", overallScore: 11 }).success).toBe(false);
  });

  it("rejects a non-integer overallScore", () => {
    expect(ratingSchema.safeParse({ gameId: "game_1", overallScore: 7.5 }).success).toBe(false);
  });

  it("rejects a sub-score outside its 1-5 range even if overallScore is valid", () => {
    const result = ratingSchema.safeParse({ gameId: "game_1", overallScore: 8, funScore: 9 });
    expect(result.success).toBe(false);
  });

  it("rejects review text over the length cap", () => {
    const result = ratingSchema.safeParse({
      gameId: "game_1",
      overallScore: 8,
      reviewText: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe("forumPostSchema", () => {
  it("rejects a title that's too short", () => {
    const result = forumPostSchema.safeParse({
      gameId: "game_1",
      title: "Hi",
      body: "Some body text",
      category: "STRATEGY",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid category", () => {
    const result = forumPostSchema.safeParse({
      gameId: "game_1",
      title: "A valid title here",
      body: "Some body text",
      category: "NOT_A_REAL_CATEGORY",
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from title and body", () => {
    const result = forumPostSchema.safeParse({
      gameId: "game_1",
      title: "  A valid title  ",
      body: "  Some body text  ",
      category: "HOUSE_RULES",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("A valid title");
      expect(result.data.body).toBe("Some body text");
    }
  });

  it("rejects a body over the length cap", () => {
    const result = forumPostSchema.safeParse({
      gameId: "game_1",
      title: "A valid title",
      body: "a".repeat(5001),
      category: "STRATEGY",
    });
    expect(result.success).toBe(false);
  });
});

describe("forumCommentSchema", () => {
  it("rejects an empty comment", () => {
    expect(forumCommentSchema.safeParse({ body: "" }).success).toBe(false);
    expect(forumCommentSchema.safeParse({ body: "   " }).success).toBe(false);
  });
});

describe("reportSchema", () => {
  it("requires postId when contentType is POST", () => {
    const result = reportSchema.safeParse({
      contentType: "POST",
      reason: "This is spam",
    });
    expect(result.success).toBe(false);
  });

  it("requires commentId when contentType is COMMENT", () => {
    const result = reportSchema.safeParse({
      contentType: "COMMENT",
      reason: "This is spam",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid POST report", () => {
    const result = reportSchema.safeParse({
      contentType: "POST",
      postId: "post_1",
      reason: "This is spam",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a reason that's too short to be useful", () => {
    const result = reportSchema.safeParse({
      contentType: "POST",
      postId: "post_1",
      reason: "x",
    });
    expect(result.success).toBe(false);
  });
});
