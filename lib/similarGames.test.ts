import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    game: { findMany: vi.fn() },
  },
}));

import { db } from "@/lib/db";
import { findSimilarGames } from "@/lib/similarGames";

const baseGame = {
  id: "wingspan",
  categories: ["Strategy", "Animals"],
  mechanics: ["Engine Building", "Card Drafting"],
  bggWeight: 2.4,
};

function makeCandidate(overrides: Partial<Record<string, unknown>>) {
  return {
    id: "candidate",
    categories: [],
    mechanics: [],
    bggWeight: 2.4,
    ...overrides,
  };
}

describe("findSimilarGames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ranks a game sharing both category and mechanic above one sharing only one", async () => {
    const highOverlap = makeCandidate({
      id: "high",
      categories: ["Strategy"],
      mechanics: ["Engine Building"],
    });
    const lowOverlap = makeCandidate({
      id: "low",
      categories: ["Strategy"],
      mechanics: [],
    });

    (db.game.findMany as any).mockResolvedValue([lowOverlap, highOverlap]);

    const results = await findSimilarGames(baseGame);

    expect(results[0].id).toBe("high");
    expect(results[1].id).toBe("low");
  });

  it("excludes the game itself from the query", async () => {
    (db.game.findMany as any).mockResolvedValue([]);

    await findSimilarGames(baseGame);

    const callArgs = (db.game.findMany as any).mock.calls[0][0];
    expect(callArgs.where.id).toEqual({ not: "wingspan" });
  });

  it("passes a 'less than' weight filter when complexityDirection is simpler", async () => {
    (db.game.findMany as any).mockResolvedValue([]);

    await findSimilarGames(baseGame, "simpler");

    const callArgs = (db.game.findMany as any).mock.calls[0][0];
    expect(callArgs.where.bggWeight).toEqual({ lt: 2.4 });
  });

  it("passes a 'greater than' weight filter when complexityDirection is harder", async () => {
    (db.game.findMany as any).mockResolvedValue([]);

    await findSimilarGames(baseGame, "harder");

    const callArgs = (db.game.findMany as any).mock.calls[0][0];
    expect(callArgs.where.bggWeight).toEqual({ gt: 2.4 });
  });

  it("applies no weight filter when complexityDirection is 'any'", async () => {
    (db.game.findMany as any).mockResolvedValue([]);

    await findSimilarGames(baseGame, "any");

    const callArgs = (db.game.findMany as any).mock.calls[0][0];
    expect(callArgs.where.bggWeight).toBeUndefined();
  });

  it("respects the limit even when more candidates overlap", async () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      makeCandidate({ id: `game_${i}`, categories: ["Strategy"] })
    );
    (db.game.findMany as any).mockResolvedValue(candidates);

    const results = await findSimilarGames(baseGame, "any", 3);

    expect(results).toHaveLength(3);
  });

  it("requests a larger candidate pool than the final limit, to leave room for ranking", async () => {
    (db.game.findMany as any).mockResolvedValue([]);

    await findSimilarGames(baseGame, "any", 6);

    const callArgs = (db.game.findMany as any).mock.calls[0][0];
    expect(callArgs.take).toBeGreaterThan(6);
  });
});
