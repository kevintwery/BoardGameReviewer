import { PrismaClient } from "@prisma/client";

// Next.js dev mode reloads modules on every file change, which would
// normally create a brand new PrismaClient (and a new DB connection pool)
// on every hot reload. Stashing the client on `globalThis` in development
// means we reuse the same instance across reloads instead of leaking
// connections. In production, `global.prisma` is never set, so we just
// create one client for the life of the server.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
