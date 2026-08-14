# Database Migrations

This project has been using `npm run db:push` throughout development,
which is fine for a schema that's still actively changing and has no
real user data to protect. **Do not use `db:push` against production once
real users exist.** Here's why, and what to do instead.

## Why `db:push` is dev-only

`prisma db push` compares `schema.prisma` to the live database and
directly alters the database to match — no history, no review step, no
rollback. For local development that's exactly what you want: fast
iteration, no ceremony. Against production data, it's the same operation
that could, for example, silently drop a column (and everything in it)
because you renamed a field, with no confirmation step and no record of
what happened.

## The production-safe workflow

Prisma's **migrations** system generates versioned, reviewable SQL files
instead of pushing changes blind:

1. **In development**, when you change `schema.prisma`:
   ```
   npm run db:migrate
   ```
   This generates a new file under `prisma/migrations/` containing the
   actual SQL, applies it to your dev database, and prompts you for a
   migration name. **Commit that generated file to git** — it's the
   permanent record of the change.

2. **Review the generated SQL** before committing, especially for
   anything beyond adding a column — Prisma sometimes generates a
   drop-and-recreate for changes it can't do in place, which would
   silently lose data on a column that had real content.

3. **In production**, deploy with:
   ```
   npm run db:migrate:deploy
   ```
   This applies any migrations that haven't run yet, in order, and
   **does not** attempt to auto-generate anything new or prompt for
   input — it's meant to run non-interactively as part of a deploy step
   (a GitHub Action, a Vercel build hook, etc.), not by hand.

## This project currently has no `prisma/migrations/` folder

Every schema change so far went through `db:push` in a sandboxed
environment with no persistent database, so there's no migration history
to hand off. **Before your first production deploy**, run:

```
npm run db:migrate
```

once, against a real (even empty) database, with a name like `init`.
That generates the baseline migration everything else builds on. From
that point forward, every schema change should go through `db:migrate`
(dev) → commit the generated file → `db:migrate:deploy` (production),
never `db:push` again.

## Rollback

Prisma doesn't auto-generate a "down" migration. If a migration causes a
problem in production:
- For an additive change (new column, new table): usually safe to leave
  as-is and fix forward with another migration, rather than rolling back.
- For a destructive change (dropped/renamed column): restore from a
  database backup taken before the migration ran — this is exactly why
  `LAUNCH.md`'s backup checklist item says to actually test a restore,
  not just confirm backups exist. A migration you can't undo is only
  recoverable if your backup strategy actually works.
