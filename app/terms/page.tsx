import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

/**
 * ⚠️ THIS IS A STRUCTURAL STUB, NOT A LEGAL DOCUMENT. See the same
 * warning in app/privacy/page.tsx — get a lawyer to review and finalize
 * this before launch.
 */
export default function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 prose prose-slate dark:prose-invert">
      <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        <strong>Placeholder document.</strong> Replace this notice and the bracketed
        placeholders below with real content reviewed by a lawyer before launch.
      </div>

      <h1>Terms of Service</h1>
      <p>Last updated: [DATE]</p>

      <h2>Your account</h2>
      <p>
        You're responsible for what's posted under your account. Don't share your
        login. [ADD: minimum age requirement, matching your decision on COPPA —
        see the launch checklist.]
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Post spam, harassment, or content unrelated to board games.</li>
        <li>Use automated tools to scrape or flood the forum, ratings, or lists.</li>
        <li>Attempt to access another user's account or data.</li>
        <li>[ADD any other prohibited uses specific to your community]</li>
      </ul>

      <h2>Content ownership</h2>
      <p>
        You retain ownership of reviews, forum posts, and other content you
        submit. By posting, you grant us a license to display it on the site.
        [CONFIRM this license language with a lawyer — it needs to be broad
        enough to let you actually run the site (display, cache, moderate) without
        overreaching into rights you don't need.]
      </p>

      <h2>Moderation</h2>
      <p>
        We may remove content or suspend accounts that violate these terms, at
        our discretion. See our{" "}
        <a href="/privacy">Privacy Policy</a> for how reported content is handled.
      </p>

      <h2>Board game data</h2>
      <p>
        Game information is sourced from BoardGameGeek (BGG). [ADD: BGG's current
        attribution/terms requirements — see the README's "BGG's API terms" note
        — once confirmed against their live terms of use.]
      </p>

      <h2>Disclaimer &amp; limitation of liability</h2>
      <p>[STANDARD LEGAL LANGUAGE — have a lawyer draft this section.]</p>

      <h2>Changes to these terms</h2>
      <p>[DESCRIBE how you'll notify users of material changes.]</p>

      <h2>Contact</h2>
      <p>Questions about these terms: [YOUR CONTACT EMAIL]</p>
    </main>
  );
}
