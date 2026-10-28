import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    game: { upsert: vi.fn(async () => ({ id: "game_1" })) },
    video: {
      findMany: vi.fn(async () => []),
      deleteMany: vi.fn((args) => ({ op: "deleteMany", args })),
      createMany: vi.fn((args) => ({ op: "createMany", args })),
    },
    $transaction: vi.fn(),
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
      bggRating: 8,
      bggRatingCount: 100,
      categories: ["Animals"],
      mechanics: ["Engine Building"],
      bggRating: 8.1,
      bggRatingCount: 12500,
      instructionalVideos: [],
    });

    await syncGameFromBgg(266192);

    expect(fetchGameFromBgg).toHaveBeenCalledWith(266192);
    const upsertArgs = (db.game.upsert as any).mock.calls[0][0];
    expect(upsertArgs.where).toEqual({ bggId: 266192 });
    expect(upsertArgs.create.slug).toBe("wingspan");
    expect(upsertArgs.update.slug).toBe("wingspan");
  });
});

describe("syncGameFromBgg videos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores game fields without the video list, then replaces only BGG-imported videos", async () => {
    (fetchGameFromBgg as any).mockResolvedValue({
      bggId: 266192,
      name: "Wingspan",
      description: "",
      imageUrl: "",
      minPlayers: 1,
      maxPlayers: 5,
      playingTime: 70,
      bggWeight: 2.4,
      bggRating: 8,
      bggRatingCount: 100,
      categories: [],
      mechanics: [],
      instructionalVideos: [
        { bggVideoId: 11, youtubeVideoId: "aaaaaaaaaaa", title: "How to play" },
        { bggVideoId: 12, youtubeVideoId: "bbbbbbbbbbb", title: "Rules in 5 minutes" },
      ],
    });

    await syncGameFromBgg(266192);

    const upsertArgs = (db.game.upsert as any).mock.calls[0][0];
    expect(upsertArgs.create).not.toHaveProperty("instructionalVideos");

    expect(db.video.deleteMany).toHaveBeenCalledWith({
      where: { gameId: "game_1", bggVideoId: { not: null } },
    });
    const { data, skipDuplicates } = (db.video.createMany as any).mock.calls[0][0];
    expect(skipDuplicates).toBe(true);
    expect(data).toEqual([
      { gameId: "game_1", bggVideoId: 11, youtubeVideoId: "aaaaaaaaaaa", title: "How to play", sortOrder: 100 },
      { gameId: "game_1", bggVideoId: 12, youtubeVideoId: "bbbbbbbbbbb", title: "Rules in 5 minutes", sortOrder: 101 },
    ]);
    // Both writes go through one transaction.
    expect((db.$transaction as any).mock.calls[0][0].map((op: any) => op.op)).toEqual(["deleteMany", "createMany"]);
  });

  it("skips BGG videos the game already has as hand-curated ones", async () => {
    (fetchGameFromBgg as any).mockResolvedValue({
      bggId: 266192,
      name: "Wingspan",
      instructionalVideos: [
        { bggVideoId: 11, youtubeVideoId: "lH2XCq0oCoA", title: "Already curated" },
        { bggVideoId: 12, youtubeVideoId: "bbbbbbbbbbb", title: "New one" },
      ],
    });
    (db.video.findMany as any).mockResolvedValueOnce([{ youtubeVideoId: "lH2XCq0oCoA" }]);

    await syncGameFromBgg(266192);

    const { data } = (db.video.createMany as any).mock.calls[0][0];
    expect(data.map((video: any) => video.bggVideoId)).toEqual([12]);
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
        bggRating: 0,
        bggRatingCount: 0,
        categories: [],
        mechanics: [],
        instructionalVideos: [],
      }),
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
