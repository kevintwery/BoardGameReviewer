import { clerkClient } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createDefaultListsForUser } from "@/lib/lists";

export interface UserProfile {
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Makes sure a signed-in Clerk user has a row in our `User` table, and
 * gives them the default lists when that row is first created. The
 * Clerk webhook normally does this at signup, but webhooks can't reach a
 * local dev server (and can be missed in production), so anything that
 * writes user-owned rows calls this first instead of failing on a
 * missing foreign key. Safe to call repeatedly.
 *
 * Existing users are left alone even if they have no lists: users may
 * delete their default lists, and those shouldn't reappear.
 */
export async function ensureUser(userId: string, profile?: UserProfile): Promise<void> {
  const existing = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (existing) return;

  const { displayName, avatarUrl } = profile ?? (await fetchClerkProfile(userId));
  try {
    await db.user.create({ data: { id: userId, displayName, avatarUrl } });
  } catch (error) {
    // A concurrent request (or the webhook) created the user — and is
    // creating their default lists — since the lookup above.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return;
    }
    throw error;
  }
  await createDefaultListsForUser(userId);
}

async function fetchClerkProfile(userId: string): Promise<UserProfile> {
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  return {
    displayName:
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      "New Player",
    avatarUrl: clerkUser.imageUrl ?? null,
  };
}
