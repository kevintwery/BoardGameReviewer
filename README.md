# Board Game Review

A mobile-friendly site for rating board games, watching how-to-play videos,
and discussing rules/strategy per game.

Getting ready to actually launch this? See **[`LAUNCH.md`](./LAUNCH.md)**
for the pre-launch checklist — legal, environment/secrets, database
pooling, admin access, monitoring, and more. Before touching the
production database at all, read **[`MIGRATIONS.md`](./MIGRATIONS.md)** —
this project used `db:push` in development, which is unsafe once real
user data exists.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **PostgreSQL** + **Prisma** (ORM)
- **Clerk** for auth (email/password + Google)
- **Tailwind CSS** for styling
- BoardGameGeek's XML API for game data, synced into our own DB

## Getting started

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — a Postgres connection string (a free [Neon](https://neon.tech) database works well)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — from [dashboard.clerk.com](https://dashboard.clerk.com)
   - `BGG_CONTACT_EMAIL` — any email, sent as a courtesy identifier in BGG API requests

3. Push the schema to your database and seed some sample games:
   ```
   npm run db:push
   npm run db:seed
   ```

4. Run the dev server:
   ```
   npm run dev
   ```

5. Visit `http://localhost:3000/games` to see the seeded game list, or
   `http://localhost:3000/games/wingspan` for a single game page.

## Project structure

```
/app                          Pages and API routes (Next.js App Router)
  page.tsx                     Homepage (search, browse, surprise me)
  /games/page.tsx               Browsable, sortable, paginated game list
  /games/[slug]/page.tsx         Single game page (hero, videos, ratings, similar games, rules)
  /games/[slug]/forum/page.tsx   Forum for one game
  /forum/posts/[postId]/page.tsx Single forum thread with comments
  /lists/page.tsx                "My Lists" overview
  /lists/[listId]/page.tsx       Single list (shelf view or row view)
  /planner/page.tsx              Game night planner
  /api/games/search/             Live search endpoint
  /api/games/planner/            Player count + time filter endpoint
  /api/games/random/             Random game picker
  /api/ratings/                  Create/update/fetch a rating
  /api/lists/                    Create lists, add/remove games from a list
  /api/forum/                    Posts, comments, voting, accepted answers
  /api/bgg-sync/                 Scheduled job that refreshes game data from BGG
  /api/webhooks/clerk/           Creates a local User + default lists on signup

/components                   UI pieces, grouped by feature area
  /games/                       HeroBanner, VideoRow, SimilarGames, SearchBox,
                                 SortControls, RatingForm, StarInput, RulesSummary,
                                 RandomGameButton
  /forum/                       PostCard, CategoryBadge, VoteButtons, NewPostForm,
                                 CommentSection, ForumPageClient, PostPageClient
  /lists/                       AddToListButton, ShelfView, ListRowView
  /planner/                     GameNightPlanner
  /ui/                           NavBar, ThemeToggle

/lib                           Non-UI logic — the "how things work" layer
  db.ts                          Shared Prisma client
  ranking.ts                     Forum hot-score sorting math
  similarGames.ts                "You might also like" query logic
  ratings.ts                     Keeps a game's average rating in sync
  lists.ts                       Creates default lists for new users
  theme.ts                       Dark mode persistence
  filterPersistence.ts           Remembers sort/filter choices
  types.ts                       Small shared types reused across components
  /bgg/                           BoardGameGeek API client + sync logic

/prisma
  schema.prisma                  Full data model — the source of truth for the DB
  seed.ts                        Sample data for local development
```

**Why the `lib` folder exists separately from `components`:** components
handle *how something looks*; `lib` handles *how something works*. If
you're trying to understand the forum ranking algorithm, you want
`lib/ranking.ts`, not to go hunting through a React component for it.
Keeping logic and presentation separate also makes the logic testable on
its own, without rendering anything.

## What's built

Every feature discussed is implemented end-to-end — page, API route, and
database schema:

- **Game pages** — hero banner, YouTube video row, description
- **Ratings** — overall score plus optional sub-ratings (fun, replayability,
  components) and the user's own complexity score, alongside BGG's own
  weight rating for reference
- **Personal lists** — the 4 default lists created automatically on signup
  (Favorites, Want to Buy, Want to Try, Games I Own), unlimited custom
  lists, public/private per list, and a dedicated box-art "shelf" view for
  owned games
- **Forum** — posts categorized as Rule Clarification / House Rules /
  Strategy, threaded comments, Reddit-style upvoting, and an accepted-answer
  flow scoped to Rule Clarification posts and the original poster
- **Browse & search** — sortable, paginated game list; live debounced search
- **Discovery** — "you might also like" (with simpler/harder filtering),
  a random-game button, and a rules-reference panel linking to BGG's
  rulebook plus the community's top-voted rule clarifications
- **Game night planner** — filter the catalog by player count and time available
- **Dark mode** and **sort/filter persistence**, both via localStorage
- **BGG sync & catalog growth** — a scheduled job (`/api/bgg-sync`, wired
  to Vercel Cron) that refreshes every synced game's data; an admin
  search-and-import flow at `/admin/games/import` for adding new games
  one at a time; and `npm run bgg:import-hot` for bulk-seeding the
  catalog from BGG's current hot-games list
- **Account deletion** — `/account`, with a genuine anonymize-vs-delete
  split: ratings and personal lists are actually deleted, but forum
  posts/comments stay up (attributed to "[deleted user]") so other
  people's threads don't break — see `lib/account.ts`
- **Auth** — Clerk middleware gating write actions (rating, posting, lists)
  while keeping browsing public, plus a webhook that mirrors new users into
  our own `User` table
- **Security** — rate limiting on every write endpoint (`lib/rateLimit.ts`,
  tuned per action in `RATE_LIMITS`), zod validation (`lib/validation.ts`)
  on every request body, and atomic single-statement SQL (not a separate
  read-then-write) for the two denormalized fields that see concurrent
  writes — see the comment in `lib/ratings.ts` for the race that closes
- **Content moderation** — a report button on every post and comment
  (`components/forum/ReportButton.tsx`), a `ForumReport` model with a
  reviewer audit trail, and an admin queue at `/admin/reports`
  (`isModerator`-gated, 404s rather than 403s for non-moderators — see the
  comment on that route for why) with dismiss / resolve / hide-content actions
- **Performance** — indexes matched to the query patterns the app actually
  runs (planner's player-count range, `ForumReport`'s pending-queue lookup,
  etc.), ISR caching on game pages (`revalidate = 300`), and two
  denormalized fields — `Game.avgRating` and `ForumPost.voteScore` —
  so listing games or forum posts never requires summing related rows
  on every read
- **Testing** — 86 Vitest tests covering every file in `lib/` at
  **98.7%+ statement / 96%+ branch coverage** with CI-enforced
  thresholds, plus a Playwright E2E scaffold (`e2e/`) covering the
  sign-up → rate → post → vote → report → moderate flow. Run
  `npm run test:coverage` for current numbers; see
  **[`TESTING.md`](./TESTING.md)** for what's covered, how, and — just
  as importantly — what isn't and why, including the E2E scaffold's
  honest not-yet-executed status
- **Operations** — `lib/errorReporting.ts` (console logging now, a
  documented one-file Sentry swap later), a documented production
  migration workflow (`MIGRATIONS.md` — this project used `db:push` in
  development, which is unsafe for real data), and a `/contact` page
  kept deliberately separate from content-moderation reports
- **Launch logistics** — dynamic sitemap and `robots.txt`, per-game Open
  Graph metadata for social sharing, privacy policy / terms of service
  stub pages (clearly marked as needing real legal review), and a
  consolidated pre-launch checklist (`LAUNCH.md`)

## What's not built yet

These were explicitly deferred, not forgotten:

- Trading/marketplace, local events/meetups, expansion tracking, designer
  and publisher pages, price comparison, and barcode scanning are all v2+
  candidates that would need real schema/scope discussions of their own
- Email digests and notifications
- A shared, cross-instance rate limit store (the current one is in-memory
  per server — see the limitation documented at the top of `lib/rateLimit.ts`)
- The Playwright E2E suite has never actually been run — see `e2e/README.md`

## A note on the BGG sync

BGG's API is XML, rate-limited, and occasionally asynchronous (it returns
HTTP 202 and expects you to poll until the data's ready). All of that
complexity is contained in `lib/bgg/client.ts` so nothing else in the
codebase needs to know about it — everywhere else just calls
`syncGameFromBgg(bggId)` and gets a normal JS object back.

The sync endpoint (`/api/bgg-sync`) is meant to be called on a schedule
(see `vercel.json`) rather than from the browser, and is protected by a
`CRON_SECRET` environment variable you should set in production.

## Setting up Clerk

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com),
   enable email/password and Google as sign-in options.
2. Copy the publishable key and secret key into `.env.local`.
3. Under **Webhooks**, add an endpoint pointing at
   `https://yourdomain.com/api/webhooks/clerk`, subscribed to the
   `user.created` event, and copy its signing secret into
   `CLERK_WEBHOOK_SECRET`. Locally, tools like `ngrok` or Clerk's own CLI
   tunnel let you test this webhook before you have a real domain.

## A note on TypeScript errors before your first `prisma generate`

Until you run `npm run db:generate` (or `db:push`, which runs it for you),
your editor will show type errors on anything touching `db.game`,
`db.rating`, etc. — Prisma generates those types from `schema.prisma` into
`node_modules/.prisma/client`, so they don't exist until that step runs.
This is expected on a fresh clone and resolves itself after your first
`npm install && npm run db:push`.
