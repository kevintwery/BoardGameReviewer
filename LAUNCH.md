# Launch Checklist

A punch list for going from "runs locally" to "real users can sign up."
Organized roughly in the order you'd actually do them — legal and admin
setup first, since those often have the longest lead time (a lawyer
reviewing terms, or a domain's DNS propagating, isn't instant).

## Legal & compliance
- [ ] Have a lawyer review and finalize `app/privacy/page.tsx` and `app/terms/page.tsx` — both are structural stubs, not real legal documents (see the warning banner on each page)
- [ ] Decide your COPPA stance explicitly (13+ only, or designed for under-13) and reflect it in the terms
- [ ] Confirm BGG's current API terms of use for attribution requirements and commercial-use restrictions
- [ ] If you'll have EU/California users: confirm your privacy policy covers GDPR/CCPA obligations, including how account deletion actually works (see "Data & backups" below)

## Environment & secrets
- [ ] Every value in `.env.example` set for real in your hosting provider's environment settings — not just `.env.local`
- [ ] `CRON_SECRET` and `CLERK_WEBHOOK_SECRET` are strong random values, not left as empty strings
- [ ] `NEXT_PUBLIC_SITE_URL` set to your real domain (used by the sitemap, robots.txt, and Open Graph tags)
- [ ] Database connection string uses a **pooled** connection if on Neon/serverless Postgres — see the "Database connection pooling" note below

## Database connection pooling
Next.js API routes on Vercel run as separate serverless functions, each
potentially opening its own database connection. Postgres has a hard
limit on concurrent connections (often as low as 20-100 depending on
plan), which a handful of simultaneous requests can exhaust if you're
connecting directly. Before launch:
- [ ] If using Neon: use the **pooled** connection string (Neon's dashboard labels this clearly) for `DATABASE_URL`, not the direct one
- [ ] If using a different Postgres host without built-in pooling: add [Prisma Accelerate](https://www.prisma.io/data-platform/accelerate) or PgBouncer in front of it

## Auth (Clerk)
- [ ] Google OAuth consent screen configured with your real privacy policy URL
- [ ] Clerk webhook endpoint pointed at your production domain, subscribed to `user.created`, with the signing secret set (see the README's "Setting up Clerk" section)
- [ ] Test the actual signup flow end-to-end in production, not just locally — webhook delivery to `localhost` doesn't happen automatically

## Admin access
- [ ] Promote at least one real account to `ADMIN` or `MODERATOR` (there's no self-serve way to do this — see the comment on `User.role` in `prisma/schema.prisma`; use `npm run db:studio` or a one-off script)
- [ ] Confirm `/admin/reports` is reachable by that account and 404s for everyone else

## Testing & CI
- [ ] `npm run test:coverage` passes locally and meets the thresholds in `vitest.config.ts` (currently 78+ tests across every file in `lib/` — see `TESTING.md` for what's covered and, honestly, what isn't)
- [ ] `.github/workflows/ci.yml` is green on the repo's default branch
- [ ] Run the Playwright E2E scaffold (`e2e/`) against a real staging environment at least once before launch — **it has not been executed anywhere yet**, only written and reviewed for correctness. See `e2e/README.md` for setup and why. Fix whatever selector breaks on the first real run.
- [ ] Manually walk through the core flows once in production: sign up, rate a game, create a forum post, vote, report a post, resolve a report as an admin, delete a test account and confirm their forum posts show "[deleted user]" instead of vanishing

## Monitoring & ops
- [ ] Real error monitoring in place — `lib/errorReporting.ts` currently just logs to the console (captured in Vercel's function logs, but nobody's watching those live). See the comment in that file for the one-file swap to Sentry
- [ ] Basic uptime/analytics — even a lightweight, privacy-respecting option (Plausible, or GA4) so you know what's actually being used post-launch
- [ ] A staging environment (a second Vercel deployment on a separate branch, pointed at a separate database) to test schema migrations before they hit production data
- [ ] `/admin/games/import` works end-to-end (search BGG, import a game) — this is how the catalog grows post-launch, not just the initial seed
- [ ] Run `npm run bgg:import-hot` at least once before launch so the catalog has more than the seed script's two games in it

## Database migrations
- [ ] Read **[`MIGRATIONS.md`](./MIGRATIONS.md)** before touching the production database. Short version: this project has been using `db:push` in development, which is unsafe for real user data — production needs a real `prisma/migrations/` history via `db:migrate` (dev) → `db:migrate:deploy` (production), and there currently is no migration history yet, so the first step is generating a baseline one.

## Data & backups
- [ ] Confirm your database host's backup schedule and retention (Neon, Railway, etc. usually have automatic backups, but confirm the plan you're on actually includes them)
- [ ] **Actually test a restore** from one of those backups into a scratch database — not just confirming backups exist. An untested backup is a hope, not a plan, and this is doubly true now that there's no rollback path for a bad migration (see `MIGRATIONS.md`'s Rollback section) other than restoring from backup.
- [x] Account deletion is implemented — `lib/account.ts` anonymizes the user (personal data like ratings/lists is genuinely deleted; forum posts/comments stay up, attributed to "[deleted user]") and removes their Clerk identity. Confirm the flow at `/account` end-to-end before launch.

## Rate limiting caveat
- [ ] Read the limitation documented at the top of `lib/rateLimit.ts` — the current limiter is in-memory and per-server-instance, which is fine for launch but won't hold up under real abuse on serverless. Upgrading to `@upstash/ratelimit` (Redis-backed) is a one-file change when it's needed.

## Domain & deployment
- [ ] Domain purchased and DNS pointed at your hosting provider
- [ ] SSL is automatic on Vercel, but confirm it's actually issued (can take a few minutes after DNS propagates)
- [ ] `vercel.json`'s cron schedule for `/api/bgg-sync` reviewed — the default is once daily at 4am UTC; adjust if that doesn't fit your catalog size
- [ ] Sitemap (`/sitemap.xml`) and `robots.txt` are reachable at your real domain post-deploy, and submitted to Google Search Console

## Content moderation readiness
- [ ] At least one person has committed to actually checking `/admin/reports` regularly — a report queue nobody looks at is worse than no report feature, since it gives reporters false confidence that something will happen
