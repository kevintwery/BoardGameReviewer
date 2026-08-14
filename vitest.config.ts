import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      // Coverage is scoped to lib/ on purpose. app/ (pages and API routes)
      // and components/ are Next.js server components, client components,
      // and route handlers — exercising those meaningfully needs a running
      // Next.js server, a real or mocked database, and a browser/DOM for
      // anything with "use client" on it. That's integration/E2E testing
      // territory (Playwright, or Next's own route-handler test helpers),
      // not something a coverage percentage over app/components would
      // represent honestly in a unit-test run. See TESTING.md for the
      // full breakdown of what's covered here vs. what still needs
      // manual or integration testing.
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/**/*.test.ts",
        "lib/db.ts", // a 6-line Prisma client singleton — nothing to meaningfully test
        "lib/types.ts", // type-only file, no runtime logic
      ],
      // Set from the actual measured coverage (98.7% statements / 96.15%
      // branches as of this writing — see TESTING.md), not an arbitrary
      // round number. A PR that meaningfully drops coverage fails CI;
      // small fluctuations from adding a new untested one-liner won't.
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
