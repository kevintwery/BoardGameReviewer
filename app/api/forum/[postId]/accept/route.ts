import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { forumAcceptSchema } from "@/lib/validation";

interface RouteParams {
  params: { postId: string };
}

// POST /api/forum/[postId]/accept
// Body: { commentId: string | null } — null clears the accepted answer.
// Only the post's original author can mark an answer as accepted, same
// as Stack Overflow's model — it's their question, so it's their call
// on which reply resolved it.
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await db.forumPost.findUnique({ where: { id: params.postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.userId !== userId) {
    return NextResponse.json(
      { error: "Only the post author can mark an accepted answer" },
      { status: 403 }
    );
  }

  const parsed = forumAcceptSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await db.forumPost.update({
    where: { id: params.postId },
    data: { acceptedCommentId: parsed.data.commentId },
  });

  return NextResponse.json({ post: updated });
}
