// Small, dependency-free constants shared between server logic and
// client components. Kept separate from files like lib/account.ts and
// lib/db.ts specifically so a client component can import a value like
// DELETED_USER_DISPLAY_NAME without accidentally pulling the Prisma
// client (or any other server-only code) into the browser bundle.

export const DELETED_USER_DISPLAY_NAME = "[deleted user]";
