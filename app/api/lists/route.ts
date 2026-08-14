import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { listCreateSchema } from "@/lib/validation";

// GET /api/lists
// Returns the signed-in user's lists, each with its items' game ids so
// the "Add to List" button can show which lists a game is already in.
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lists = await db.gameList.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: { items: { select: { gameId: true } } },
  });

  return NextResponse.json({ lists });
}

// POST /api/lists
// Creates a new custom list for the signed-in user. The 4 default lists
// are created separately at signup (see lib/lists.ts) — this is only for
// user-created additional lists.
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(userId, "listCreate");
  if (limited) {
    return NextResponse.json(
      { error: limited.error },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = listCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const list = await db.gameList.create({
    data: { userId, name: parsed.data.name, isDefault: false, isOwnedList: false },
  });

  return NextResponse.json({ list });
}
