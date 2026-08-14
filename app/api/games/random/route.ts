import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/games/random — used by the "Surprise me" button on the homepage
export async function GET() {
  // $queryRaw is used here (instead of a Prisma findMany + JS random pick)
  // so we don't have to pull every game's data into memory just to throw
  // most of it away — ORDER BY RANDOM() does the picking in the database.
  const result = await db.$queryRaw<Array<{ slug: string }>>`
    SELECT slug FROM "Game" ORDER BY RANDOM() LIMIT 1
  `;

  if (result.length === 0) {
    return NextResponse.json({ error: "No games available" }, { status: 404 });
  }

  return NextResponse.json({ slug: result[0].slug });
}
