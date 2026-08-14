// Small, reusable shapes for the subset of fields components commonly
// need. These intentionally don't try to mirror the full Prisma models —
// just what's used across more than one file. Prefer importing the real
// Prisma-generated types (e.g. `import type { Game } from "@prisma/client"`)
// when a function needs the complete model.

export interface GameSummary {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  avgRating: number;
  ratingCount: number;
}

export interface GameListSummary {
  id: string;
  name: string;
  items: { id: string; gameId: string }[];
}
