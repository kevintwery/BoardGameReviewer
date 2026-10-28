import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteUserList } from "@/lib/lists";
import { enforceRateLimit } from "@/lib/rateLimit";

interface RouteParams {
  params: { listId: string };
}

// DELETE /api/lists/[listId] — delete one of the user's own lists
// (default or custom), along with the games saved in it.
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(userId, "listDelete");
  if (limited) {
    return NextResponse.json(
      { error: limited.error },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const result = await deleteUserList(userId, params.listId);
  if (result === "not_found") {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
