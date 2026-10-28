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

export type DeleteListResult = "deleted" | "not_found";

/**
 * Deletes one of a user's own lists, default or custom (its items
 * cascade with it). Deleted default lists stay deleted — ensureUser
 * (lib/users.ts) only creates them for brand-new users.
 *
 * "not_found" covers both a missing list and someone else's list, so the
 * API doesn't reveal which list ids exist.
 */
export async function deleteUserList(userId: string, listId: string): Promise<DeleteListResult> {
  const list = await db.gameList.findUnique({
    where: { id: listId },
    select: { userId: true },
  });

  if (!list || list.userId !== userId) return "not_found";

  await db.gameList.delete({ where: { id: listId } });
  return "deleted";
}
