/**
 * Bulk-imports BoardGameGeek's current "hot games" list (their front-page
 * ranking of ~50 currently popular board games) into our catalog.
 *
 * This exists because the admin search-and-import UI (/admin/games/import)
 * is great for adding one game at a time, but a brand-new deployment
 * needs *something* in the catalog before anyone can browse it. Rather
 * than hand-picking an arbitrary starter list, this seeds from what's
 * actually popular on BGG right now.
 *
 * Usage:
 *   npm run bgg:import-hot
 *
 * Safe to re-run — syncGameFromBgg upserts, so running this again just
 * refreshes the same ~50 games rather than duplicating them.
 */
import { fetchHotGameIds } from "@/lib/bgg/client";
import { syncGamesFromBgg } from "@/lib/bgg/sync";

async function main() {
  console.log("Fetching BGG's current hot games list…");
  const hotGameIds = await fetchHotGameIds();
  console.log(`Found ${hotGameIds.length} games. Importing (this takes a while — BGG asks for a 1s gap between requests)…`);

  await syncGamesFromBgg(hotGameIds);

  console.log(`Done. Imported/refreshed ${hotGameIds.length} games.`);
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
