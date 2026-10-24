import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    game: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { db } from "@/lib/db";
import { findGamesPage, parseGameSort, parseSortOrder } from "@/lib/gameSort";

const findMany = db.game.findMany as any;
const count = db.game.count as any;

describe("parseGameSort / parseSortOrder", () => {
  it("accepts the supported sorts", () => {
    expect(parseGameSort("name")).toBe("name");
    expect(parseGameSort("weight")).toBe("weight");
  });

  it("falls back to rating for missing or retired values", () => {
    expect(parseGameSort(undefined)).toBe("rating");
    expect(parseGameSort("type")).toBe("rating");
  });

  it("defaults the order to desc", () => {
    expect(parseSortOrder("asc")).toBe("asc");
    expect(parseSortOrder(undefined)).toBe("desc");
    expect(parseSortOrder("sideways")).toBe("desc");
  });
});

describe("findGamesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
  });

  it("sorts by rating and name with a single query", async () => {
    await findGamesPage({ sort: "rating", order: "desc", page: 2, pageSize: 20 });

    expect(findMany).toHaveBeenCalledWith({ orderBy: { avgRating: "desc" }, skip: 20, take: 20 });
  });

  it("sorts known weights in the requested direction, ties by name", async () => {
    count.mockResolvedValue(50);
    findMany.mockResolvedValueOnce(Array(20).fill({}));

    await findGamesPage({ sort: "weight", order: "asc", page: 1, pageSize: 20 });

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { bggWeight: { gt: 0 } },
      orderBy: [{ bggWeight: "asc" }, { name: "asc" }],
      skip: 0,
      take: 20,
    });
  });

  it("fills the rest of the page with unknown-weight games after the known ones run out", async () => {
    count.mockResolvedValue(25);
    findMany.mockResolvedValueOnce(Array(5).fill({ known: true })).mockResolvedValueOnce([{ known: false }]);

    const games = await findGamesPage({ sort: "weight", order: "asc", page: 2, pageSize: 20 });

    expect(findMany).toHaveBeenLastCalledWith({
      where: { bggWeight: { lte: 0 } },
      orderBy: { name: "asc" },
      skip: 0,
      take: 15,
    });
    expect(games).toHaveLength(6);
  });

  it("pages through only unknown-weight games once past the known ones", async () => {
    count.mockResolvedValue(25);

    await findGamesPage({ sort: "weight", order: "desc", page: 3, pageSize: 20 });

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { bggWeight: { lte: 0 } },
      orderBy: { name: "asc" },
      skip: 15,
      take: 20,
    });
  });
});
