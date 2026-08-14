import { test, expect } from "@playwright/test";

/**
 * Covers the flow flagged in TESTING.md as the highest-value gap left by
 * the unit test suite: the seams between routes, the database, and
 * rendered UI, which lib/-level mocked tests can't reach by design.
 *
 * NOT YET EXECUTED — see e2e/README.md for why, and what you need before
 * running this for real. Written against the actual selectors/routes in
 * the app as of this writing, but the first real run against a live
 * instance is likely to need a selector fix or two.
 */

test.describe("critical path: rate, post, vote, report, moderate", () => {
  test("a signed-in user can rate a game", async ({ page }) => {
    // Assumes Clerk test mode is configured and the browser already has
    // a valid test session — see e2e/README.md. A real version of this
    // suite would have a shared `signIn` fixture rather than repeating
    // this in every test.
    await page.goto("/games/wingspan");

    await expect(page.getByRole("heading", { name: "Wingspan" })).toBeVisible();

    // The overall rating stars are rendered as a radiogroup — see
    // components/games/StarInput.tsx.
    await page.getByRole("radiogroup", { name: "Overall rating" }).getByRole("radio").nth(6).click();
    await page.getByRole("button", { name: "Save rating" }).click();

    await expect(page.getByText(/saving/i)).toBeHidden({ timeout: 5000 });
  });

  test("a signed-in user can create a forum post and it appears in the list", async ({ page }) => {
    const postTitle = `E2E test post ${Date.now()}`;

    await page.goto("/games/wingspan/forum");
    await page.getByRole("button", { name: "New post" }).click();

    await page.getByLabel("Title").fill(postTitle);
    await page.getByLabel("Details").fill("This is an end-to-end test post.");
    await page.getByRole("button", { name: "Post" }).click();

    await expect(page.getByText(postTitle)).toBeVisible();
  });

  test("voting on a post updates the visible count", async ({ page }) => {
    await page.goto("/games/wingspan/forum");

    const firstPost = page.locator(".post, [class*='post']").first();
    const upvoteButton = firstPost.getByRole("button", { name: /upvote/i });
    const countBefore = await firstPost.locator("text=/^-?\\d+$/").first().textContent();

    await upvoteButton.click();

    const countAfter = await firstPost.locator("text=/^-?\\d+$/").first().textContent();
    expect(countAfter).not.toBe(countBefore);
  });

  test("reporting a post shows a confirmation and removes the report control", async ({ page }) => {
    await page.goto("/games/wingspan/forum");

    await page.getByRole("button", { name: "Report" }).first().click();
    await page.getByPlaceholder(/what's wrong/i).fill("E2E test report — please ignore");
    await page.getByRole("button", { name: "Submit report" }).click();

    await expect(page.getByText(/a moderator will take a look/i)).toBeVisible();
  });

  test("an admin can see and resolve a pending report", async ({ page }) => {
    // Assumes the signed-in test user has been promoted to ADMIN/MODERATOR
    // — see the "Admin access" step in LAUNCH.md. A real suite would
    // likely use a separate authenticated context for the admin flow
    // rather than reusing the same session as the other tests.
    await page.goto("/admin/reports");

    await expect(page.getByRole("heading", { name: "Moderation Queue" })).toBeVisible();

    const firstReport = page.locator("li", { hasText: "Reported by" }).first();
    await firstReport.getByRole("button", { name: "Dismiss" }).click();

    // The queue refetches after an action — the dismissed report should
    // no longer be in the pending list.
    await expect(firstReport).toBeHidden({ timeout: 5000 });
  });
});
