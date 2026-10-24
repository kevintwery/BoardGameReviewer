/**
 * Re-imports every game already in our catalog from BoardGameGeek,
 * refreshing its weight, player counts, categories, etc.
 *
 * This is the same refresh the nightly cron (app/api/bgg-sync/route.ts)
 * does, but runnable locally — useful when the catalog was filled before
 * a field was imported, or on a dev database the cron never touches.
 *
 * Usage:
 *   npm run bgg:sync-all
 *
 * Safe to re-run — syncGameFromBgg upserts by BGG id.
 */
import { db } from "@/lib/db";
import { syncGamesFromBgg } from "@/lib/bgg/sync";

async function main() {
  const games = await db.game.findMany({ select: { bggId: true } });
  console.log(`Re-syncing ${games.length} games from BGG (about 1s per game)…`);

  await syncGamesFromBgg(games.map((game) => game.bggId));

  console.log(`Done. Refreshed ${games.length} games.`);
}

main()
  .catch((error) => {
    console.error("Sync failed:", error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
