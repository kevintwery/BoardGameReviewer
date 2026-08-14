import { z } from "zod";

/**
 * Validation schemas for every request body a write endpoint accepts.
 *
 * Keeping these in one file (rather than inline `if` checks scattered
 * across route handlers) does two things: it's the one place to look
 * when tuning a length limit, and it guarantees every route validates
 * the same way instead of each author reinventing slightly different
 * checks. Every route that writes to the database should run its input
 * through one of these via `schema.safeParse(body)` before touching Prisma.
 *
 * The length limits here aren't arbitrary — they also double as a basic
 * defense against storage abuse (someone scripting huge review bodies to
 * bloat the database) and a content-quality nudge (a forum post title
 * capped at 150 characters can't devolve into a full paragraph).
 */

const scoreRange = (max: number) => z.number().int().min(1).max(max);

export const ratingSchema = z.object({
  gameId: z.string().min(1),
  overallScore: scoreRange(10),
  funScore: scoreRange(5).optional().nullable(),
  replayScore: scoreRange(5).optional().nullable(),
  componentScore: scoreRange(5).optional().nullable(),
  complexityScore: scoreRange(5).optional().nullable(),
  reviewText: z.string().max(2000).optional().nullable(),
});

export const forumPostSchema = z.object({
  gameId: z.string().min(1),
  title: z.string().trim().min(3, "Title needs to be at least 3 characters").max(150),
  body: z.string().trim().min(1).max(5000),
  category: z.enum(["RULE_CLARIFICATION", "HOUSE_RULES", "STRATEGY"]),
});

export const forumCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const forumVoteSchema = z.object({
  voteValue: z.union([z.literal(1), z.literal(-1)]),
});

export const forumAcceptSchema = z.object({
  commentId: z.string().min(1).nullable(),
});

export const listCreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const listItemSchema = z.object({
  gameId: z.string().min(1),
});

export const reportSchema = z
  .object({
    contentType: z.enum(["POST", "COMMENT"]),
    postId: z.string().min(1).optional(),
    commentId: z.string().min(1).optional(),
    reason: z.string().trim().min(3, "Please give a brief reason").max(500),
  })
  .refine((data) => (data.contentType === "POST" ? !!data.postId : !!data.commentId), {
    message: "postId is required for POST reports, commentId is required for COMMENT reports",
  });

export const reportResolutionSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
  hideContent: z.boolean().optional(),
});
