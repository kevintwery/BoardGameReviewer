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

export type DeleteListResult = "deleted" | "not_found" | "default_list";

/**
 * Deletes one of a user's own lists (its items cascade with it). Default
 * lists can't be deleted: ensureUser (lib/users.ts) re-creates them if
 * they go missing, so deleting one would only appear to work.
 *
 * "not_found" covers both a missing list and someone else's list, so the
 * API doesn't reveal which list ids exist.
 */
export async function deleteUserList(userId: string, listId: string): Promise<DeleteListResult> {
  const list = await db.gameList.findUnique({
    where: { id: listId },
    select: { userId: true, isDefault: true },
  });

  if (!list || list.userId !== userId) return "not_found";
  if (list.isDefault) return "default_list";

  await db.gameList.delete({ where: { id: listId } });
  return "deleted";
}
