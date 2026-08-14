import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { forumPostSchema } from "@/lib/validation";

const VALID_CATEGORIES = ["RULE_CLARIFICATION", "HOUSE_RULES", "STRATEGY"] as const;

// GET /api/forum?gameId=...&category=...
// Lists forum posts for a game, optionally filtered by category. Sorting
// by "hot score" happens client-side/in the page component (see
// lib/ranking.ts) since it depends on the current time, not something we
// want to bake into a cached query.
//
// Performance note: this reads `voteScore` (denormalized on ForumPost —
// see lib/forumVotes.ts) and `_count` for comments, instead of fetching
// every vote row and every comment row just to measure them. Same
// reasoning as Game.avgRating: summing/counting on every read gets
// expensive as threads grow; a value kept in sync on write stays cheap
// to read no matter how large the underlying table gets.
export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId");
  const category = request.nextUrl.searchParams.get("category");

  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  const posts = await db.forumPost.findMany({
    where: {
      gameId,
      isHidden: false, // moderator-hidden posts never appear in public listings
      ...(category && isValidCategory(category) && { category }),
    },
    include: {
      user: { select: { displayName: true, avatarUrl: true } },
      _count: { select: { comments: true } },
      acceptedComment: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ posts });
}

// POST /api/forum — create a new post
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(userId, "forumPost");
  if (limited) {
    return NextResponse.json(
      { error: limited.error },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = forumPostSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { gameId, title, body, category } = parsed.data;

  const post = await db.forumPost.create({
    data: { gameId, userId, title, body, category },
  });

  return NextResponse.json({ post });
}

function isValidCategory(value: unknown): value is (typeof VALID_CATEGORIES)[number] {
  return typeof value === "string" && (VALID_CATEGORIES as readonly string[]).includes(value);
}
