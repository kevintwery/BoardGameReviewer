import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { forumCommentSchema } from "@/lib/validation";

interface RouteParams {
  params: { postId: string };
}

// POST /api/forum/[postId]/comments — add a comment (reply) to a post
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(userId, "forumComment");
  if (limited) {
    return NextResponse.json(
      { error: limited.error },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = forumCommentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const comment = await db.forumComment.create({
    data: { postId: params.postId, userId, body: parsed.data.body },
    include: { user: { select: { displayName: true, avatarUrl: true } } },
  });

  return NextResponse.json({ comment });
}
