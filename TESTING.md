# Testing

## Running tests

```
npm test              # run once
npm run test:watch    # re-run on file changes
npm run test:coverage # run with a coverage report
npm run test:e2e      # Playwright E2E — see e2e/README.md before running
```

Coverage also runs in CI on every push/PR (`.github/workflows/ci.yml`)
and fails the build if it drops below the thresholds in `vitest.config.ts`.
`test:e2e` does **not** run in CI — it needs a real database and Clerk
test credentials that aren't provisioned there. See `e2e/README.md`.

## Current coverage

As of this writing: **98.7% statements, 96.15% branches** across `lib/`
(78 tests, 13 files). Run `npm run test:coverage` for the up-to-date
numbers — this file describes the *shape* of coverage, not a snapshot
that will stay accurate forever.

## What's covered, and how

Every file in `lib/` has a corresponding `*.test.ts`. Three different
strategies, depending on what the file actually does:

- **Pure logic** (`ranking.ts`, `validation.ts`, `bgg/sync.ts`'s
  `slugify`) — tested directly, no mocking needed. These are the
  highest-value tests: pure functions are cheap to test and a regression
  here is exactly the kind of thing that looks fine in a PR review but
  breaks a live feature (a sign error in the hot-score math, a validation
  schema that's too permissive).
- **Database-dependent logic** (`ratings.ts`, `forumVotes.ts`, `lists.ts`,
  `moderation.ts`, `similarGames.ts`, `bgg/sync.ts`'s orchestration) —
  `@/lib/db` is mocked with `vi.mock`, so these test *what the function
  asks Prisma to do* (the right `where`, the right computed values)
  without needing a real Postgres connection. This catches logic bugs
  (wrong aggregation, wrong fallback value) but does **not** catch actual
  database/schema problems — a typo'd column name would still pass these
  tests and fail against a real database.
- **DOM-dependent logic** (`theme.ts`, `filterPersistence.ts`) — run
  under a per-file `jsdom` environment (`// @vitest-environment jsdom`
  at the top of the file) so `localStorage`, `document`, and
  `matchMedia` are real enough to exercise honestly.
- **External API client** (`bgg/client.ts`) — `global.fetch` is mocked
  with a realistic sample XML response, including the 202-retry-then-200
  path. Fake timers (`vi.useFakeTimers`) skip the real sleep delays so
  the retry/backoff tests run in milliseconds instead of seconds.

## A note on testing the denormalized-field race fix

`lib/ratings.ts` and `lib/forumVotes.ts` recalculate a denormalized value
(`Game.avgRating`, `ForumPost.voteScore`) using a single atomic SQL
statement (`db.$executeRaw`) instead of a separate read-then-write —
see the comment in `lib/ratings.ts` for the concurrent-write race this
closes. The unit tests for these two files can only verify *that* a
single atomic statement is issued and scoped to the right row — a mocked
database has no concept of concurrency, so it can't actually prove the
race is fixed. That claim rests on the SQL itself (computing the
aggregate in a subquery within the same statement as the UPDATE) plus
how Postgres serializes concurrent UPDATEs to the same row, not on
anything a unit test observes. Worth keeping in mind if this logic ever
changes — the test suite would happily pass a version that reintroduced
the race, as long as it still called `$executeRaw` once.

## What's intentionally NOT covered by this suite

Coverage is scoped to `lib/` on purpose (see the comment in
`vitest.config.ts`). `app/` (pages, layouts, API route handlers) and
`components/` are excluded, not because they don't matter, but because a
Vitest unit-test run in a Node environment can't exercise them honestly:

- **API route handlers** (`app/api/**/route.ts`) call into `lib/`
  functions that *are* tested, but the routes themselves also do auth
  checks, rate limiting, and request parsing that only make sense with a
  running Next.js server and real HTTP requests. This is what Next's own
  route-handler testing utilities, or an integration test hitting a real
  (test) database, are for — not currently set up.
- **Server components** (`app/**/page.tsx`) run Prisma queries directly
  at render time and return JSX — testing them meaningfully needs
  something like Playwright driving a real running app, not a unit test.
- **Client components** (`components/**`, anything with `"use client"`)
  are UI — button clicks, form state, conditional rendering. React
  Testing Library would be the right tool here; it isn't set up yet.

**The honest summary:** the business logic (ranking, validation, rate
limiting, moderation rules, BGG parsing) is well-tested in isolation.
The seams connecting that logic to HTTP requests, a real database, and
rendered UI now have a starting E2E scaffold — see **`e2e/`** — but it
has not been executed against a live instance yet (see `e2e/README.md`
for exactly what that means and what's needed before it can run for
real). Until it's actually run once, treat it as a well-considered
draft, not a verified safety net.

## A note on the two remaining uncovered lines

`npm run test:coverage` shows two files just under 100% branch coverage,
left that way deliberately rather than contorted to chase the number:

- **`lib/rateLimit.ts` lines 40-43** — the periodic cleanup callback
  passed to `setInterval` (it prunes expired rate-limit buckets every 10
  minutes). Testing it would mean either waiting 10 real minutes or
  refactoring a background hygiene task into something more testable
  than it's worth for what it does.
- **`lib/theme.ts` line 10** — the `typeof window === "undefined"`
  guard, which only matters if this function is ever called during
  server-side rendering. It's real defensive code (worth keeping), but
  the jsdom test environment always has a `window`, so this specific
  branch can't be exercised without faking module-level SSR conditions,
  which isn't worth the complexity it'd add to the test.
