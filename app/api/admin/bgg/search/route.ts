import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isModerator } from "@/lib/moderation";
import { searchBggGames } from "@/lib/bgg/client";
import { db } from "@/lib/db";
import { withErrorReporting } from "@/lib/errorReporting";

// GET /api/admin/bgg/search?q=wingspan
// Searches BGG by name and flags which results are already in our
// catalog, so the admin UI can show "already added" instead of letting
// someone accidentally re-import (harmless — upsert handles it — but
// confusing UX otherwise).
export const GET = withErrorReporting(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId || !(await isModerator(userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchBggGames(query);

  const existingGames = await db.game.findMany({
    where: { bggId: { in: results.map((r) => r.bggId) } },
    select: { bggId: true },
  });
  const existingIds = new Set(existingGames.map((g: { bggId: number }) => g.bggId));

  return NextResponse.json({
    results: results.map((result) => ({ ...result, alreadyAdded: existingIds.has(result.bggId) })),
  });
});
