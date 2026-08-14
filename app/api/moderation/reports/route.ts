import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isModerator } from "@/lib/moderation";

// GET /api/moderation/reports
// Lists PENDING reports, oldest first, for the moderation queue.
//
// A non-moderator gets a 404 rather than a 403 here — a 403 confirms
// "this thing exists but you can't see it," which tells an attacker
// there's an admin surface worth probing. 404 gives them nothing to
// distinguish "doesn't exist" from "exists but you're not allowed."
export async function GET() {
  const { userId } = await auth();
  if (!userId || !(await isModerator(userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reports = await db.forumReport.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      reporter: { select: { displayName: true } },
      post: {
        select: { id: true, title: true, body: true, isHidden: true, game: { select: { slug: true, name: true } } },
      },
      comment: {
        select: { id: true, body: true, isHidden: true, post: { select: { id: true, title: true } } },
      },
    },
  });

  return NextResponse.json({ reports });
}
