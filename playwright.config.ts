import { defineConfig, devices } from "@playwright/test";

/**
 * These E2E tests need a real running instance of the app — a dev
 * server, a real (test) Postgres database, and real Clerk test-mode
 * credentials — none of which exist in an isolated CI sandbox by
 * default. See e2e/README.md before running these for the first time.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
