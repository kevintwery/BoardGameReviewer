import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    gameList: { createMany: vi.fn() },
  },
}));

import { db } from "@/lib/db";
import { createDefaultListsForUser } from "@/lib/lists";

describe("createDefaultListsForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates exactly the 4 expected default lists for the given user", async () => {
    await createDefaultListsForUser("user_123");

    expect(db.gameList.createMany).toHaveBeenCalledTimes(1);
    const { data } = (db.gameList.createMany as any).mock.calls[0][0];

    expect(data).toHaveLength(4);
    expect(data.map((list: any) => list.name)).toEqual([
      "Favorites",
      "Want to Buy",
      "Want to Try",
      "Games I Own",
    ]);
  });

  it("marks every default list as isDefault", async () => {
    await createDefaultListsForUser("user_123");
    const { data } = (db.gameList.createMany as any).mock.calls[0][0];

    expect(data.every((list: any) => list.isDefault === true)).toBe(true);
  });

  it("only marks 'Games I Own' as an owned/shelf-view list", async () => {
    await createDefaultListsForUser("user_123");
    const { data } = (db.gameList.createMany as any).mock.calls[0][0];

    const ownedLists = data.filter((list: any) => list.isOwnedList);
    expect(ownedLists).toHaveLength(1);
    expect(ownedLists[0].name).toBe("Games I Own");
  });

  it("scopes every created list to the given userId", async () => {
    await createDefaultListsForUser("user_abc");
    const { data } = (db.gameList.createMany as any).mock.calls[0][0];

    expect(data.every((list: any) => list.userId === "user_abc")).toBe(true);
  });
});
