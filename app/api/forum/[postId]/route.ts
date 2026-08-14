import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: { postId: string };
}

// GET /api/forum/[postId] — full post detail with comments
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const post = await db.forumPost.findUnique({
    where: { id: params.postId },
    include: {
      user: { select: { displayName: true, avatarUrl: true } },
      acceptedComment: true,
      // Hidden comments are excluded from the thread entirely rather than
      // shown with a "[removed]" placeholder — for a rules/strategy forum
      // there's little value in showing that something was taken down,
      // and it avoids drawing attention to moderation actions.
      comments: {
        where: { isHidden: false },
        include: { user: { select: { displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
      },
      game: { select: { name: true, slug: true } },
    },
  });

  if (!post || post.isHidden) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}
