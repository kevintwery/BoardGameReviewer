import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { listItemSchema } from "@/lib/validation";

interface RouteParams {
  params: { listId: string };
}

// POST /api/lists/[listId]/items — add a game to this list
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(userId, "listItem");
  if (limited) {
    return NextResponse.json(
      { error: limited.error },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = listItemSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { gameId } = parsed.data;

  // Confirm the list actually belongs to this user before adding to it —
  // without this check, anyone could add games to anyone else's list id.
  const list = await db.gameList.findUnique({ where: { id: params.listId } });
  if (!list || list.userId !== userId) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  const item = await db.gameListItem.upsert({
    where: { listId_gameId: { listId: params.listId, gameId } },
    create: { listId: params.listId, gameId },
    update: {}, // already in the list — nothing to change
  });

  return NextResponse.json({ item });
}

// DELETE /api/lists/[listId]/items — remove a game from this list
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = enforceRateLimit(userId, "listItem");
  if (limited) {
    return NextResponse.json(
      { error: limited.error },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = listItemSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { gameId } = parsed.data;

  const list = await db.gameList.findUnique({ where: { id: params.listId } });
  if (!list || list.userId !== userId) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  await db.gameListItem.deleteMany({
    where: { listId: params.listId, gameId },
  });

  return NextResponse.json({ success: true });
}
