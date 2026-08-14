import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

// Next.js convention: a file named sitemap.ts in /app is automatically
// served at /sitemap.xml. Game pages are the site's real SEO value (see
// the README's SEO note on long-tail searches like "wingspan rules
// clarification") — listing them explicitly, instead of relying on
// crawlers to discover them via links, gets them indexed faster.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const games = await db.game.findMany({
    select: { slug: true, updatedAt: true },
  });

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/games`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/planner`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const gamePages: MetadataRoute.Sitemap = games.flatMap((game: { slug: string; updatedAt: Date }) => [
    {
      url: `${baseUrl}/games/${game.slug}`,
      lastModified: game.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/games/${game.slug}/forum`,
      lastModified: game.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    },
  ]);

  return [...staticPages, ...gamePages];
}
