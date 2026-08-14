import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchGameFromBgg, searchBggGames, fetchHotGameIds } from "@/lib/bgg/client";

// A trimmed but structurally real sample of what BGG's /thing endpoint
// returns, covering every field the client parses: a primary + alternate
// name (to test we pick the primary one), player count, playing time,
// weight, and both category and mechanic links mixed together (to test
// the type filter actually filters).
const SAMPLE_BGG_XML = `<?xml version="1.0" encoding="utf-8"?>
<items>
  <item type="boardgame" id="266192">
    <name type="primary" sortindex="1" value="Wingspan" />
    <name type="alternate" sortindex="1" value="Wingspan: European Edition" />
    <description>A competitive bird-collection engine-builder.</description>
    <image>https://cf.geekdo-images.com/wingspan.jpg</image>
    <minplayers value="1" />
    <maxplayers value="5" />
    <playingtime value="70" />
    <link type="boardgamecategory" id="1" value="Animals" />
    <link type="boardgamecategory" id="2" value="Card Game" />
    <link type="boardgamemechanic" id="3" value="Engine Building" />
    <statistics page="1">
      <ratings>
        <averageweight value="2.4" />
      </ratings>
    </statistics>
  </item>
</items>`;

function mockFetchOnce(status: number, body: string) {
  return {
    status,
    statusText: status === 200 ? "OK" : status === 202 ? "Accepted" : "Error",
    text: () => Promise.resolve(body),
  };
}

describe("fetchGameFromBgg", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("parses the primary name, not an alternate name", async () => {
    (global.fetch as any).mockResolvedValue(mockFetchOnce(200, SAMPLE_BGG_XML));

    const game = await fetchGameFromBgg(266192);

    expect(game.name).toBe("Wingspan");
  });

  it("parses player count, playing time, and weight as numbers", async () => {
    (global.fetch as any).mockResolvedValue(mockFetchOnce(200, SAMPLE_BGG_XML));

    const game = await fetchGameFromBgg(266192);

    expect(game.minPlayers).toBe(1);
    expect(game.maxPlayers).toBe(5);
    expect(game.playingTime).toBe(70);
    expect(game.bggWeight).toBe(2.4);
  });

  it("separates categories and mechanics by their link type", async () => {
    (global.fetch as any).mockResolvedValue(mockFetchOnce(200, SAMPLE_BGG_XML));

    const game = await fetchGameFromBgg(266192);

    expect(game.categories).toEqual(["Animals", "Card Game"]);
    expect(game.mechanics).toEqual(["Engine Building"]);
  });

  it("falls back to the first name if none is tagged 'primary'", async () => {
    const xmlWithNoPrimaryName = SAMPLE_BGG_XML.replace(
      `<name type="primary" sortindex="1" value="Wingspan" />`,
      `<name type="alternate" sortindex="1" value="Wingspan" />`
    );
    (global.fetch as any).mockResolvedValue(mockFetchOnce(200, xmlWithNoPrimaryName));

    const game = await fetchGameFromBgg(266192);

    expect(game.name).toBe("Wingspan");
  });

  it("retries on a 202 response and returns the data once BGG has it ready", async () => {
    vi.useFakeTimers();
    const fetchMock = global.fetch as any;
    fetchMock
      .mockResolvedValueOnce(mockFetchOnce(202, ""))
      .mockResolvedValueOnce(mockFetchOnce(200, SAMPLE_BGG_XML));

    const promise = fetchGameFromBgg(266192);
    // The client sleeps between poll attempts — fast-forward through it
    // instead of the test actually waiting in real time.
    await vi.advanceTimersByTimeAsync(2000);

    const game = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(game.name).toBe("Wingspan");
  });

  it("throws after exhausting retries on repeated 202s", async () => {
    vi.useFakeTimers();
    (global.fetch as any).mockResolvedValue(mockFetchOnce(202, ""));

    const promise = fetchGameFromBgg(266192);
    const expectation = expect(promise).rejects.toThrow(/did not return data/);
    await vi.advanceTimersByTimeAsync(2000 * 5);
    await expectation;
  });

  it("throws immediately on a real error status without retrying", async () => {
    (global.fetch as any).mockResolvedValue(mockFetchOnce(500, ""));

    await expect(fetchGameFromBgg(266192)).rejects.toThrow(/BGG API request failed: 500/);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

const SAMPLE_SEARCH_XML = `<?xml version="1.0" encoding="utf-8"?>
<items type="boardgame">
  <item type="boardgame" id="266192">
    <name type="primary" value="Wingspan" />
    <yearpublished value="2019" />
  </item>
  <item type="boardgame" id="341254">
    <name type="primary" value="Wingspan: Asia" />
    <yearpublished value="2021" />
  </item>
</items>`;

describe("searchBggGames", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns bggId, name, and year for each result", async () => {
    (global.fetch as any).mockResolvedValue(mockFetchOnce(200, SAMPLE_SEARCH_XML));

    const results = await searchBggGames("wingspan");

    expect(results).toEqual([
      { bggId: 266192, name: "Wingspan", yearPublished: 2019 },
      { bggId: 341254, name: "Wingspan: Asia", yearPublished: 2021 },
    ]);
  });

  it("URL-encodes the query so special characters don't break the request", async () => {
    (global.fetch as any).mockResolvedValue(mockFetchOnce(200, `<items></items>`));

    await searchBggGames("Roll & Write");

    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain(encodeURIComponent("Roll & Write"));
  });

  it("returns an empty array when BGG has no matches, rather than throwing", async () => {
    (global.fetch as any).mockResolvedValue(mockFetchOnce(200, `<items></items>`));

    const results = await searchBggGames("zzzznonexistentgame");

    expect(results).toEqual([]);
  });
});

const SAMPLE_HOT_XML = `<?xml version="1.0" encoding="utf-8"?>
<items type="boardgame">
  <item id="342942" rank="1"><name value="Ark Nova" /></item>
  <item id="266192" rank="2"><name value="Wingspan" /></item>
  <item id="174430" rank="3"><name value="Gloomhaven" /></item>
</items>`;

describe("fetchHotGameIds", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the bgg ids from the hot list, in rank order", async () => {
    (global.fetch as any).mockResolvedValue(mockFetchOnce(200, SAMPLE_HOT_XML));

    const ids = await fetchHotGameIds();

    expect(ids).toEqual([342942, 266192, 174430]);
  });
});
