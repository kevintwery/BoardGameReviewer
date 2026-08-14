import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    rating: { findMany: vi.fn(), deleteMany: vi.fn() },
    gameList: { deleteMany: vi.fn() },
    user: { update: vi.fn() },
    // recalculateGameRatingStats (called for each affected game) now
    // issues a single atomic $executeRaw statement instead of separate
    // aggregate()/update() calls — see lib/ratings.ts.
    $executeRaw: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { deleteUserAccount } from "@/lib/account";
import { DELETED_USER_DISPLAY_NAME } from "@/lib/constants";

describe("deleteUserAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.rating.findMany as any).mockResolvedValue([]);
  });

  it("genuinely deletes ratings and lists, not just hides them", async () => {
    await deleteUserAccount("user_1");

    expect(db.rating.deleteMany).toHaveBeenCalledWith({ where: { userId: "user_1" } });
    expect(db.gameList.deleteMany).toHaveBeenCalledWith({ where: { userId: "user_1" } });
  });

  it("anonymizes the user row instead of deleting it", async () => {
    await deleteUserAccount("user_1");

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: expect.objectContaining({
        displayName: DELETED_USER_DISPLAY_NAME,
        avatarUrl: null,
        deletedAt: expect.any(Date),
      }),
    });
  });

  it("recalculates every game the user had rated, after their ratings are gone", async () => {
    (db.rating.findMany as any).mockResolvedValue([
      { gameId: "game_a" },
      { gameId: "game_b" },
    ]);

    await deleteUserAccount("user_1");

    // One recalculation call per affected game — recalculateGameRatingStats
    // issues exactly one $executeRaw per call (see lib/ratings.test.ts),
    // so two affected games means two calls here.
    expect(db.$executeRaw).toHaveBeenCalledTimes(2);
    const [firstCallArgs, secondCallArgs] = (db.$executeRaw as any).mock.calls;
    expect(firstCallArgs).toContain("game_a");
    expect(secondCallArgs).toContain("game_b");
  });

  it("does nothing to game stats when the user had no ratings", async () => {
    (db.rating.findMany as any).mockResolvedValue([]);

    await deleteUserAccount("user_1");

    expect(db.$executeRaw).not.toHaveBeenCalled();
  });

  it("deletes ratings before anonymizing the user, so the lookup isn't stale", async () => {
    const callOrder: string[] = [];
    (db.rating.findMany as any).mockImplementation(() => {
      callOrder.push("findMany");
      return Promise.resolve([]);
    });
    (db.rating.deleteMany as any).mockImplementation(() => {
      callOrder.push("deleteMany");
      return Promise.resolve({});
    });
    (db.user.update as any).mockImplementation(() => {
      callOrder.push("userUpdate");
      return Promise.resolve({});
    });

    await deleteUserAccount("user_1");

    expect(callOrder).toEqual(["findMany", "deleteMany", "userUpdate"]);
  });
});
