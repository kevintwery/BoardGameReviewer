import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const MAX_RESULTS = 8;

// GET /api/games/search?q=wing
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  if (query.trim().length === 0) {
    return NextResponse.json({ games: [] });
  }

  const games = await db.game.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
    },
    select: { id: true, slug: true, name: true, imageUrl: true },
    take: MAX_RESULTS,
    orderBy: { avgRating: "desc" },
  });

  return NextResponse.json({ games });
}
