import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { forumVoteSchema } from "@/lib/validation";
import { recalculateForumPostVoteScore } from "@/lib/forumVotes";

interface RouteParams {
  params: { postId: string };
}

// POST /api/forum/[postId]/vote
// Body: { voteValue: 1 | -1 }
// Casting the same vote again removes it (toggle behavior) — clicking
// upvote twice clears your vote rather than doing nothing.
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(userId, "forumVote");
  if (limited) {
    return NextResponse.json(
      { error: limited.error },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = forumVoteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { voteValue } = parsed.data;

  const existingVote = await db.forumVote.findUnique({
    where: { postId_userId: { postId: params.postId, userId } },
  });

  let voted: number | null;

  if (existingVote?.voteValue === voteValue) {
    await db.forumVote.delete({ where: { id: existingVote.id } });
    voted = null;
  } else {
    const vote = await db.forumVote.upsert({
      where: { postId_userId: { postId: params.postId, userId } },
      create: { postId: params.postId, userId, voteValue },
      update: { voteValue },
    });
    voted = vote.voteValue;
  }

  // Keep the post's denormalized voteScore in sync — see the comment on
  // recalculateForumPostVoteScore for why this is a separate step rather
  // than a database trigger.
  await recalculateForumPostVoteScore(params.postId);

  return NextResponse.json({ voted });
}
