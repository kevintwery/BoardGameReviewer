import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { recalculateGameRatingStats } from "@/lib/ratings";
import { enforceRateLimit } from "@/lib/rateLimit";
import { ratingSchema } from "@/lib/validation";

// GET /api/ratings?gameId=...
// Returns the signed-in user's own rating for a game, if they've left one.
// Used to pre-fill the rating form when they revisit a game they already rated.
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gameId = request.nextUrl.searchParams.get("gameId");
  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  const rating = await db.rating.findUnique({
    where: { userId_gameId: { userId, gameId } },
  });

  return NextResponse.json({ rating });
}

// POST /api/ratings
// Creates a new rating, or updates the user's existing rating for that
// game if they've already rated it (one rating per user per game — see
// the @@unique constraint on the Rating model).
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(userId, "rating");
  if (limited) {
    return NextResponse.json(
      { error: limited.error },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = ratingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const body = parsed.data;

  const rating = await db.rating.upsert({
    where: { userId_gameId: { userId, gameId: body.gameId } },
    create: {
      userId,
      gameId: body.gameId,
      overallScore: body.overallScore,
      funScore: body.funScore,
      replayScore: body.replayScore,
      componentScore: body.componentScore,
      complexityScore: body.complexityScore,
      reviewText: body.reviewText,
    },
    update: {
      overallScore: body.overallScore,
      funScore: body.funScore,
      replayScore: body.replayScore,
      componentScore: body.componentScore,
      complexityScore: body.complexityScore,
      reviewText: body.reviewText,
    },
  });

  // Keep the game's denormalized avgRating/ratingCount in sync. See the
  // comment on recalculateGameRatingStats for why this is a separate step
  // rather than a database trigger.
  await recalculateGameRatingStats(body.gameId);

  return NextResponse.json({ rating });
}
