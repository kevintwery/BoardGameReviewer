import { db } from "@/lib/db";

// The lists every new user gets automatically. Kept as data (not
// hardcoded in three separate places) so changing the starter set is a
// one-line edit here.
const DEFAULT_LISTS = [
  { name: "Favorites", isOwnedList: false },
  { name: "Want to Buy", isOwnedList: false },
  { name: "Want to Try", isOwnedList: false },
  { name: "Games I Own", isOwnedList: true },
] as const;

/**
 * Creates the standard starter lists for a newly signed-up user.
 * Call this once, right after a user first appears in our `User` table
 * (e.g. from a Clerk webhook — see app/api/webhooks/clerk/route.ts).
 */
export async function createDefaultListsForUser(userId: string): Promise<void> {
  await db.gameList.createMany({
    data: DEFAULT_LISTS.map((list) => ({
      userId,
      name: list.name,
      isDefault: true,
      isOwnedList: list.isOwnedList,
    })),
  });
}
