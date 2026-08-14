import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncGamesFromBgg } from "@/lib/bgg/sync";
import { withErrorReporting } from "@/lib/errorReporting";

/**
 * Refreshes our local game data from BGG. Configured to run on a
 * schedule via Vercel Cron — see vercel.json — rather than being hit
 * from the browser.
 *
 * Protected by CRON_SECRET so this endpoint can't be triggered by
 * anyone who finds the URL: Vercel Cron sends this header automatically
 * for scheduled invocations.
 *
 * Wrapped in withErrorReporting because this route depends entirely on
 * an external service (BGG's API) that we don't control — a timeout, a
 * malformed response, or BGG being down should get logged somewhere
 * we'll notice, not silently 500 a cron job nobody's watching in real
 * time. This is the reference example for the pattern — see the comment
 * on lib/errorReporting.ts for applying it to other routes.
 */
export const GET = withErrorReporting(async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Re-sync every game we already have. New games get added separately
  // via an admin action, since BGG doesn't offer a clean "everything new
  // since X" endpoint.
  const existingGames = await db.game.findMany({ select: { bggId: true } });
  await syncGamesFromBgg(existingGames.map((game: { bggId: number }) => game.bggId));

  return NextResponse.json({ synced: existingGames.length });
});
