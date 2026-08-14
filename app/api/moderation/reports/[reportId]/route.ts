import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isModerator, hideContent } from "@/lib/moderation";
import { reportResolutionSchema } from "@/lib/validation";

interface RouteParams {
  params: { reportId: string };
}

// POST /api/moderation/reports/[reportId]
// Body: { status: "RESOLVED" | "DISMISSED", hideContent?: boolean }
// Marks a report reviewed. If hideContent is true, the underlying post
// or comment is soft-hidden (see lib/moderation.ts) at the same time —
// a moderator taking action shouldn't need a second request for that.
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId || !(await isModerator(userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = reportResolutionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { status, hideContent: shouldHide } = parsed.data;

  const report = await db.forumReport.findUnique({ where: { id: params.reportId } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (shouldHide) {
    const contentId = report.contentType === "POST" ? report.postId : report.commentId;
    if (contentId) await hideContent(report.contentType, contentId);
  }

  const updated = await db.forumReport.update({
    where: { id: params.reportId },
    data: { status, reviewedAt: new Date(), reviewedBy: userId },
  });

  return NextResponse.json({ report: updated });
}
