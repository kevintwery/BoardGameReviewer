import { db } from "@/lib/db";
import { fetchGameFromBgg } from "@/lib/bgg/client";

/**
 * Fetches a game's latest data from BGG and writes it into our own
 * database, creating the row if it doesn't exist yet or updating it if
 * it does. This is what keeps our `Game` table current without querying
 * BGG on every page load.
 *
 * Called by the scheduled sync route (app/api/bgg-sync/route.ts) and can
 * also be called manually to add a single new game to the site.
 */
export async function syncGameFromBgg(bggId: number): Promise<void> {
  const data = await fetchGameFromBgg(bggId);
  const slug = slugify(data.name);

  await db.game.upsert({
    where: { bggId: data.bggId },
    create: { ...data, slug },
    update: { ...data, slug },
  });
}

/**
 * Syncs a list of games one at a time. BGG asks API consumers not to
 * hammer their servers with concurrent requests, so we go sequentially
 * with a small delay rather than firing everything in parallel.
 */
export async function syncGamesFromBgg(bggIds: number[]): Promise<void> {
  for (const bggId of bggIds) {
    await syncGameFromBgg(bggId);
    await sleep(1000);
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
