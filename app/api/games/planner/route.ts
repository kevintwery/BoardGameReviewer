import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/games/planner?players=4&maxMinutes=60
export async function GET(request: NextRequest) {
  const players = Number(request.nextUrl.searchParams.get("players") ?? "0");
  const maxMinutes = Number(request.nextUrl.searchParams.get("maxMinutes") ?? "0");

  const games = await db.game.findMany({
    where: {
      ...(players > 0 && { minPlayers: { lte: players }, maxPlayers: { gte: players } }),
      ...(maxMinutes > 0 && { playingTime: { lte: maxMinutes } }),
    },
    orderBy: { avgRating: "desc" },
    take: 20,
  });

  return NextResponse.json({ games });
}
