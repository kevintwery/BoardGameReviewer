import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { createDefaultListsForUser } from "@/lib/lists";

/**
 * Clerk sends a webhook here whenever a user is created, updated, or
 * deleted. We only care about "user.created": that's our one chance to
 * mirror the new user into our own `User` table and set up their 3
 * default lists (see lib/lists.ts) before they do anything else on the
 * site.
 *
 * Setup: in the Clerk dashboard, add an endpoint pointing at
 * https://yourdomain.com/api/webhooks/clerk subscribed to the
 * "user.created" event, then copy its signing secret into
 * CLERK_WEBHOOK_SECRET in your environment variables.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }

  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: any;
  try {
    // Verifying the signature proves this request actually came from
    // Clerk and wasn't forged by someone hitting our endpoint directly.
    event = new Webhook(webhookSecret).verify(payload, headers);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "user.created") {
    const clerkUser = event.data;
    const displayName =
      [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ") ||
      clerkUser.username ||
      "New Player";

    await db.user.create({
      data: {
        id: clerkUser.id,
        displayName,
        avatarUrl: clerkUser.image_url ?? null,
      },
    });

    await createDefaultListsForUser(clerkUser.id);
  }

  return NextResponse.json({ received: true });
}
