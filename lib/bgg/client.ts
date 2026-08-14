import { parseStringPromise } from "xml2js";

/**
 * Client for BoardGameGeek's public XML API (api.geekdo.com/xmlapi2).
 *
 * Two things make this API annoying, which is why this logic lives in one
 * place instead of being copy-pasted wherever we need game data:
 *
 * 1. It returns XML, not JSON — every response has to be parsed.
 * 2. Some endpoints are asynchronous: BGG queues the request and replies
 *    with HTTP 202 ("try again shortly") until the data is ready. We poll
 *    for it below.
 */

const BGG_BASE_URL = "https://api.geekdo.com/xmlapi2";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 5;

export interface BggGameData {
  bggId: number;
  name: string;
  description: string;
  imageUrl: string;
  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
  bggWeight: number;
  categories: string[];
  mechanics: string[];
}

/**
 * Fetches full details for a single game by its BGG id.
 */
export async function fetchGameFromBgg(bggId: number): Promise<BggGameData> {
  const url = `${BGG_BASE_URL}/thing?id=${bggId}&stats=1`;
  const xml = await fetchWithPolling(url);
  const parsed = await parseStringPromise(xml);

  const item = parsed.items.item[0];

  return {
    bggId,
    name: extractPrimaryName(item),
    description: item.description[0],
    imageUrl: item.image[0],
    minPlayers: Number(item.minplayers[0].$.value),
    maxPlayers: Number(item.maxplayers[0].$.value),
    playingTime: Number(item.playingtime[0].$.value),
    bggWeight: Number(
      item.statistics[0].ratings[0].averageweight[0].$.value
    ),
    categories: extractLinksByType(item, "boardgamecategory"),
    mechanics: extractLinksByType(item, "boardgamemechanic"),
  };
}

export interface BggSearchResult {
  bggId: number;
  name: string;
  yearPublished: number | null;
}

/**
 * Searches BGG by name — used by the admin "add a game" flow so a
 * moderator can find the right BGG id without knowing it ahead of time.
 * Restricted to type=boardgame so we don't pull in expansions,
 * accessories, or RPGs mixed into the results.
 */
export async function searchBggGames(query: string): Promise<BggSearchResult[]> {
  const url = `${BGG_BASE_URL}/search?type=boardgame&query=${encodeURIComponent(query)}`;
  const xml = await fetchWithPolling(url);
  const parsed = await parseStringPromise(xml);

  const items = parsed.items.item ?? [];
  return items.map((item: any) => ({
    bggId: Number(item.$.id),
    name: extractPrimaryName(item),
    yearPublished: item.yearpublished ? Number(item.yearpublished[0].$.value) : null,
  }));
}

/**
 * Fetches BGG's current "hot games" list (their front-page ranking of
 * ~50 currently popular board games). Used to seed or grow the catalog
 * with games people are actually talking about right now, rather than
 * an arbitrary hardcoded list — see scripts/import-hot-games.ts.
 */
export async function fetchHotGameIds(): Promise<number[]> {
  const url = `${BGG_BASE_URL}/hot?type=boardgame`;
  const xml = await fetchWithPolling(url);
  const parsed = await parseStringPromise(xml);

  const items = parsed.items.item ?? [];
  return items.map((item: any) => Number(item.$.id));
}

/**
 * BGG's `thing` endpoint occasionally returns HTTP 202 while it prepares
 * the response, and expects the client to retry after a short delay
 * rather than treating that as an error.
 */
async function fetchWithPolling(url: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const response = await fetch(url, {
      headers: {
        // BGG asks API consumers to identify themselves — see their API
        // terms of use. Set BGG_CONTACT_EMAIL in .env.local.
        "User-Agent": `board-game-review (${process.env.BGG_CONTACT_EMAIL ?? "no-contact-set"})`,
      },
    });

    if (response.status === 200) {
      return response.text();
    }

    if (response.status === 202) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    throw new Error(`BGG API request failed: ${response.status} ${response.statusText}`);
  }

  throw new Error(`BGG API did not return data after ${MAX_POLL_ATTEMPTS} attempts: ${url}`);
}

function extractPrimaryName(item: any): string {
  const names = item.name as Array<{ $: { type: string; value: string } }>;
  const primary = names.find((n) => n.$.type === "primary");
  return (primary ?? names[0]).$.value;
}

function extractLinksByType(item: any, linkType: string): string[] {
  const links = item.link as Array<{ $: { type: string; value: string } }>;
  return links.filter((link) => link.$.type === linkType).map((link) => link.$.value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
