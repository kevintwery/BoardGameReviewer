import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    game: { upsert: vi.fn() },
  },
}));
vi.mock("@/lib/bgg/client", () => ({
  fetchGameFromBgg: vi.fn(),
}));

import { db } from "@/lib/db";
import { fetchGameFromBgg } from "@/lib/bgg/client";
import { syncGameFromBgg, syncGamesFromBgg, slugify } from "@/lib/bgg/sync";

describe("slugify", () => {
  it("lowercases and hyphenates a normal title", () => {
    expect(slugify("Wingspan")).toBe("wingspan");
    expect(slugify("Terraforming Mars")).toBe("terraforming-mars");
  });

  it("strips punctuation instead of keeping it", () => {
    expect(slugify("Marvel Champions: The Card Game")).toBe("marvel-champions-the-card-game");
  });

  it("collapses multiple separators into a single hyphen", () => {
    expect(slugify("Roll  &  Write")).toBe("roll-write");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("- Edge Case -")).toBe("edge-case");
  });
});

describe("syncGameFromBgg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches BGG data, derives a slug, and upserts by bggId", async () => {
    (fetchGameFromBgg as any).mockResolvedValue({
      bggId: 266192,
      name: "Wingspan",
      description: "A bird game.",
      imageUrl: "https://example.com/wingspan.jpg",
      minPlayers: 1,
      maxPlayers: 5,
      playingTime: 70,
      bggWeight: 2.4,
      categories: ["Animals"],
      mechanics: ["Engine Building"],
    });

    await syncGameFromBgg(266192);

    expect(fetchGameFromBgg).toHaveBeenCalledWith(266192);
    const upsertArgs = (db.game.upsert as any).mock.calls[0][0];
    expect(upsertArgs.where).toEqual({ bggId: 266192 });
    expect(upsertArgs.create.slug).toBe("wingspan");
    expect(upsertArgs.update.slug).toBe("wingspan");
  });
});

describe("syncGamesFromBgg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("syncs every id in the list, sequentially", async () => {
    (fetchGameFromBgg as any).mockImplementation((bggId: number) =>
      Promise.resolve({
        bggId,
        name: `Game ${bggId}`,
        description: "",
        imageUrl: "",
        minPlayers: 1,
        maxPlayers: 4,
        playingTime: 30,
        bggWeight: 1,
        categories: [],
        mechanics: [],
      })
    );

    const promise = syncGamesFromBgg([1, 2, 3]);
    // Each iteration sleeps 1s between games — fast-forward through all
    // of them so the test doesn't take 3 real seconds.
    await vi.advanceTimersByTimeAsync(3000);
    await promise;

    expect(fetchGameFromBgg).toHaveBeenCalledTimes(3);
    expect(fetchGameFromBgg).toHaveBeenNthCalledWith(1, 1);
    expect(fetchGameFromBgg).toHaveBeenNthCalledWith(2, 2);
    expect(fetchGameFromBgg).toHaveBeenNthCalledWith(3, 3);
  });
});
