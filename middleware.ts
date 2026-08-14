import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require a signed-in user for every method — reading these
// always needs to know who's asking (e.g. "my ratings", "my lists"),
// so there's no anonymous-GET case to carve out.
const isAlwaysProtectedRoute = createRouteMatcher([
  "/lists(.*)",
  "/account(.*)",
  "/api/ratings(.*)",
  "/api/lists(.*)",
  "/api/account(.*)",
  "/api/moderation(.*)", // route handlers also re-check the moderator role
  "/api/admin(.*)", // same — routes re-check isModerator independently
  "/admin(.*)",
]);

// Forum browsing (GET) is intentionally public — see the nav/homepage
// design. Only the write actions (posting, commenting, voting, accepting
// an answer, reporting) require sign-in. Gating on req.method here means
// we don't have to enumerate every forum sub-route separately.
const isForumWriteRoute = createRouteMatcher(["/api/forum(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAlwaysProtectedRoute(req)) {
    await auth.protect();
    return;
  }

  if (isForumWriteRoute(req) && req.method !== "GET") {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)", // run on every route except static files
    "/(api|trpc)(.*)",
  ],
};
