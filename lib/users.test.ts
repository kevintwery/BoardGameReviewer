import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/lists", () => ({ createDefaultListsForUser: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(async () => ({
    users: {
      getUser: vi.fn(async () => ({
        firstName: "Ada",
        lastName: "Lovelace",
        username: null,
        imageUrl: "https://img.example/ada.png",
      })),
    },
  })),
}));

import { db } from "@/lib/db";
import { createDefaultListsForUser } from "@/lib/lists";
import { ensureUser } from "@/lib/users";

const findUnique = db.user.findUnique as any;
const create = db.user.create as any;

describe("ensureUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing for an existing user, even one who deleted their default lists", async () => {
    findUnique.mockResolvedValue({ id: "user_123" });

    await ensureUser("user_123");

    expect(create).not.toHaveBeenCalled();
    expect(createDefaultListsForUser).not.toHaveBeenCalled();
  });

  it("creates the user from their Clerk profile, then their default lists", async () => {
    findUnique.mockResolvedValue(null);

    await ensureUser("user_123");

    expect(create).toHaveBeenCalledWith({
      data: { id: "user_123", displayName: "Ada Lovelace", avatarUrl: "https://img.example/ada.png" },
    });
    expect(createDefaultListsForUser).toHaveBeenCalledWith("user_123");
  });

  it("uses a provided profile instead of calling Clerk", async () => {
    findUnique.mockResolvedValue(null);

    await ensureUser("user_123", { displayName: "From Webhook", avatarUrl: null });

    expect(create).toHaveBeenCalledWith({
      data: { id: "user_123", displayName: "From Webhook", avatarUrl: null },
    });
  });

  it("skips the default lists if a concurrent request already created the user", async () => {
    findUnique.mockResolvedValue(null);
    create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    await ensureUser("user_123");

    expect(createDefaultListsForUser).not.toHaveBeenCalled();
  });
});
