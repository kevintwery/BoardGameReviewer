import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { deleteUserAccount } from "@/lib/account";
import { withErrorReporting } from "@/lib/errorReporting";

// DELETE /api/account
// Body: { confirm: true } — a deliberately explicit body rather than
// treating any DELETE request as consent, since this is irreversible.
//
// Order matters here: we anonymize our own database first, then remove
// the Clerk identity. If the DB step succeeded and the Clerk call failed,
// the worst case is "still logged in, but already anonymized" — annoying
// but recoverable (they can hit delete again). The reverse order risks
// "locked out, but data still intact," which isn't recoverable by the
// user at all.
export const DELETE = withErrorReporting(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== true) {
    return NextResponse.json(
      { error: "Confirmation required to delete your account." },
      { status: 400 }
    );
  }

  await deleteUserAccount(userId);

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  return NextResponse.json({ deleted: true });
});
