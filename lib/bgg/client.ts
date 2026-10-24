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

const BGG_BASE_URL = "https://boardgamegeek.com/xmlapi2/";
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
  bggRating: number;
  bggRatingCount: number;
}

/**
 * Fetches full details for a single game by its BGG id.
 */
export async function fetchGameFromBgg(bggId: number): Promise<BggGameData> {
  const url = `${BGG_BASE_URL}/thing?id=${bggId}&stats=1`;
  const xml = await fetchWithPolling(url);
  const parsed = await parseStringPromise(xml);

  const item = parsed.items.item[0];
  const boardGameItem = {
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
      bggRating: Number(item.statistics[0].ratings[0].average[0].$.value),
      bggRatingCount: Number(item.statistics[0].ratings[0].usersrated[0].$.value),
    };
  return boardGameItem;
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

export interface BggForumThread {
  id: number;
  subject: string;
  author: string;
  replyCount: number;
  lastPostDate: Date | null;
  url: string;
}

export interface BggForum {
  id: number;
  title: string;
  url: string;
  threads: BggForumThread[];
}

// BGG forum data changes slowly and every game page wants it, so let
// Next's fetch cache serve it for a while instead of asking BGG again
// each time the page revalidates.
const FORUM_CACHE_SECONDS = 6 * 60 * 60;

/**
 * Fetches a game's BGG forums with the given titles (BGG gives every game
 * the same set: "Rules", "Strategy", "General", "Variants", …) and the
 * most recently active threads in each. We only keep thread titles and
 * link out to BGG for the posts themselves — post bodies belong to
 * their authors and BGG.
 */
export async function fetchGameForums(
  bggId: number,
  forumTitles: string[],
  threadsPerForum = 5
): Promise<BggForum[]> {
  const listXml = await fetchWithPolling(`${BGG_BASE_URL}/forumlist?id=${bggId}&type=thing`, {
    next: { revalidate: FORUM_CACHE_SECONDS },
  });
  const list = await parseStringPromise(listXml);
  const forums: Array<{ $: { id: string; title: string } }> = list.forums?.forum ?? [];

  // Keep the caller's order (e.g. Rules before Strategy), not BGG's.
  const wanted = forumTitles
    .map((title) => forums.find((forum) => forum.$.title.toLowerCase() === title.toLowerCase()))
    .filter((forum): forum is (typeof forums)[number] => Boolean(forum));

  const result: BggForum[] = [];
  // Sequential, not Promise.all — BGG asks clients not to fire
  // concurrent requests.
  for (const forum of wanted) {
    const forumId = Number(forum.$.id);
    const forumXml = await fetchWithPolling(`${BGG_BASE_URL}/forum?id=${forumId}&page=1`, {
      next: { revalidate: FORUM_CACHE_SECONDS },
    });
    const parsed = await parseStringPromise(forumXml);
    const threads: Array<{ $: Record<string, string> }> = parsed.forum?.threads?.[0]?.thread ?? [];

    result.push({
      id: forumId,
      title: forum.$.title,
      url: `https://boardgamegeek.com/forum/${forumId}`,
      threads: threads.slice(0, threadsPerForum).map(({ $ }) => ({
        id: Number($.id),
        subject: $.subject,
        author: $.author,
        // numarticles counts the opening post too.
        replyCount: Math.max(0, Number($.numarticles) - 1),
        lastPostDate: $.lastpostdate ? new Date($.lastpostdate) : null,
        url: `https://boardgamegeek.com/thread/${$.id}`,
      })),
    });
  }

  return result;
}

/**
 * BGG's `thing` endpoint occasionally returns HTTP 202 while it prepares
 * the response, and expects the client to retry after a short delay
 * rather than treating that as an error.
 */
async function fetchWithPolling(url: string, init: RequestInit = {}): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: {
        // BGG asks API consumers to identify themselves — see their API
        // terms of use. Set BGG_CONTACT_EMAIL in .env.local.
        "User-Agent": `board-game-review (${process.env.BGG_CONTACT_EMAIL ?? "ktwery3@gmail.com"})`,
        "Authorization": `Bearer ${process.env.BGG_API_KEY ?? "78c7554e-5d6a-4a17-9639-bbf5315fee82"}`, // optional
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
