import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isModerator } from "@/lib/moderation";
import { syncGameFromBgg } from "@/lib/bgg/sync";
import { enforceRateLimit } from "@/lib/rateLimit";
import { withErrorReporting } from "@/lib/errorReporting";
import { z } from "zod";

const importSchema = z.object({ bggId: z.number().int().positive() });

// POST /api/admin/bgg/import
// Body: { bggId: number }
// Imports (or re-syncs, if it already exists) a single game by BGG id.
// This is the same underlying function the scheduled /api/bgg-sync job
// uses — the only thing different here is that it's triggered by an
// admin action on a game that might be brand new to our catalog, rather
// than refreshing one we already have.
export const POST = withErrorReporting(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId || !(await isModerator(userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const limited = enforceRateLimit(userId, "bggImport");
  if (limited) {
    return NextResponse.json(
      { error: limited.error },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = importSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  await syncGameFromBgg(parsed.data.bggId);

  return NextResponse.json({ imported: true });
});
