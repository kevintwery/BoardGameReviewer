import { db } from "@/lib/db";

/**
 * Checks whether a user has MODERATOR or ADMIN privileges. Every
 * moderation-only route should call this and bail out (404, not 403 —
 * see the comment in the reports route) if it returns false.
 *
 * There's no self-serve way to become a moderator on purpose — promoting
 * a user is a manual `db.user.update({ data: { role: "ADMIN" } })`, e.g.
 * via Prisma Studio (`npm run db:studio`).
 */
export async function isModerator(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "MODERATOR" || user?.role === "ADMIN";
}

/**
 * Hides a forum post or comment (soft-hide, not delete — see the
 * isHidden comment on the schema for why). Used when a moderator
 * resolves a report and chooses to take the content down.
 */
export async function hideContent(contentType: "POST" | "COMMENT", contentId: string): Promise<void> {
  if (contentType === "POST") {
    await db.forumPost.update({ where: { id: contentId }, data: { isHidden: true } });
  } else {
    await db.forumComment.update({ where: { id: contentId }, data: { isHidden: true } });
  }
}
