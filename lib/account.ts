import { db } from "@/lib/db";
import { recalculateGameRatingStats } from "@/lib/ratings";
import { DELETED_USER_DISPLAY_NAME } from "@/lib/constants";

/**
 * Deletes a user's account.
 *
 * This is a deliberate mix of "actually delete" and "anonymize in
 * place," not a blanket cascade:
 *
 * - Personal data (ratings, personal lists) is genuinely deleted —
 *   nobody else has a reason to see it, and there's no cost to removing
 *   it outright. Ratings need their affected games' avgRating/ratingCount
 *   recalculated afterward, same as any other rating change.
 * - Forum content (posts, comments) is kept, because other people's
 *   threads reference it — a reply to a since-deleted post, or an
 *   accepted answer, would break or lose meaning if the post vanished.
 *   Instead we anonymize the User row itself: name becomes "[deleted
 *   user]", avatar is cleared, and `deletedAt` is set. The post stays
 *   exactly where it was, just attributed to nobody.
 * - Forum votes are left as-is. They're not displayed with an author
 *   (see components/forum/VoteButtons.tsx), so there's nothing to
 *   anonymize, and removing them would silently change other people's
 *   vote totals as a side effect of an unrelated account decision.
 *
 * The Clerk-side identity (actual login credentials) is handled
 * separately by the caller — see app/api/account/route.ts — since that's
 * a call to Clerk's API, not something this function needs to know about.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  // Ratings affect other rows' denormalized stats, so we need to know
  // which games to recalculate before the ratings disappear.
  const affectedGameIds = await db.rating
    .findMany({ where: { userId }, select: { gameId: true } })
    .then((ratings: Array<{ gameId: string }>) => ratings.map((r) => r.gameId));

  await db.rating.deleteMany({ where: { userId } });
  await db.gameList.deleteMany({ where: { userId } }); // cascades to GameListItem

  await db.user.update({
    where: { id: userId },
    data: {
      displayName: DELETED_USER_DISPLAY_NAME,
      avatarUrl: null,
      deletedAt: new Date(),
    },
  });

  // Recalculate every game this user had rated, now that their rating is
  // gone. Sequential rather than Promise.all — this is a rare, one-time
  // operation (account deletion), not a hot path, so there's no reason
  // to add concurrent-write pressure on the database for it.
  for (const gameId of affectedGameIds) {
    await recalculateGameRatingStats(gameId);
  }
}
