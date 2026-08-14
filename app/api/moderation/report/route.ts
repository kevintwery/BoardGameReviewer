import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { reportSchema } from "@/lib/validation";

// POST /api/moderation/report
// Body: { contentType: "POST" | "COMMENT", postId?, commentId?, reason }
// Anyone signed in can file a report — no special role required. Reports
// just land in the queue at app/admin/reports for a moderator to review;
// filing one never hides content immediately (that would make reporting
// itself an abuse vector).
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(userId, "report");
  if (limited) {
    return NextResponse.json(
      { error: limited.error },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = reportSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { contentType, postId, commentId, reason } = parsed.data;

  const report = await db.forumReport.create({
    data: {
      contentType,
      postId: contentType === "POST" ? postId : undefined,
      commentId: contentType === "COMMENT" ? commentId : undefined,
      reporterId: userId,
      reason,
    },
  });

  return NextResponse.json({ report });
}
