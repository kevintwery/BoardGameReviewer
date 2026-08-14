# End-to-end tests

## Honest status

These tests are a **starting scaffold, not a running suite**. They were
written and reviewed for correctness against the app's actual routes and
selectors, but have not been executed against a live instance — that
needs a running dev server, a real (test) Postgres database, and Clerk
test-mode credentials, none of which exist in this project's automated
CI or the environment these tests were authored in.

Before relying on these:
1. Point `DATABASE_URL` at a real (ideally disposable/seeded-per-run) test database
2. Configure Clerk's [test mode](https://clerk.com/docs/testing/test-emails-and-phones) so `example+clerk_test@example.com`-style emails skip real verification
3. Run `npx playwright install` once, to download browser binaries
4. Run `npm run test:e2e`

## What's covered

`critical-path.spec.ts` walks the flow flagged in `TESTING.md` as the
highest-value gap in the current suite: sign up → rate a game → post in
the forum → vote → report a post → moderate it as an admin. This is
exactly the kind of thing unit tests structurally can't catch — it
exercises the real seams between a route handler, the database, and
rendered UI, which is precisely where `lib/`-level mocked tests can't
reach.

## Why this wasn't run as part of building it

Building this inside an isolated tool-use environment without a
provisioned Postgres instance or Clerk test credentials means there's no
way to actually execute these tests here and confirm they pass — running
`npm run test:e2e` would just fail to connect to a database that doesn't
exist. Rather than claim these are verified when they aren't, this file
says so directly. Treat these specs as a well-considered draft: run them
against your actual staging environment before trusting them, and expect
to fix a selector or two against the real rendered DOM the first time
they run.
