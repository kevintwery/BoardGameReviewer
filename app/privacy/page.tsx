import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

/**
 * ⚠️ THIS IS A STRUCTURAL STUB, NOT A LEGAL DOCUMENT.
 *
 * It lists the sections a privacy policy for this app needs and roughly
 * what belongs in each, based on what the app actually collects (see
 * prisma/schema.prisma — email/auth via Clerk, ratings, forum posts,
 * lists). It is NOT reviewed by a lawyer and should not be treated as
 * compliant with GDPR, CCPA, or any other privacy law as-is.
 *
 * Before launch: have an actual lawyer review and finalize this, and
 * update the [PLACEHOLDER] values below. Google's OAuth consent screen
 * setup will also ask for a live privacy policy URL — this page fills
 * that requirement structurally, but the content needs to be accurate
 * before you rely on it.
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 prose prose-slate dark:prose-invert">
      <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        <strong>Placeholder document.</strong> Replace this notice and the bracketed
        placeholders below with real content reviewed by a lawyer before launch.
      </div>

      <h1>Privacy Policy</h1>
      <p>Last updated: [DATE]</p>

      <h2>What we collect</h2>
      <ul>
        <li>Account info via our authentication provider (Clerk): email address, and profile photo if you sign in with Google.</li>
        <li>Content you create: ratings, reviews, forum posts and comments, and your personal lists.</li>
        <li>Basic usage analytics: [DESCRIBE YOUR ANALYTICS TOOL, e.g. Plausible/GA4, and what it tracks].</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To operate your account and display your ratings/posts/lists back to you and other users.</li>
        <li>To calculate aggregate game ratings shown to all visitors.</li>
        <li>[ADD: any email communications — digests, notifications — if you build them]</li>
      </ul>

      <h2>Third parties we share data with</h2>
      <ul>
        <li><strong>Clerk</strong> — authentication and account management.</li>
        <li><strong>[YOUR HOSTING PROVIDER, e.g. Vercel]</strong> — hosting and infrastructure.</li>
        <li><strong>[YOUR DATABASE PROVIDER, e.g. Neon]</strong> — data storage.</li>
        <li>We do not sell personal data to third parties.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        [DESCRIBE: how a user requests deletion of their account and data, how to
        request a copy of their data, and any regional rights that apply — GDPR
        for EU users, CCPA for California users, etc. This needs to match what
        your app can actually do — see the account-deletion note in the README.]
      </p>

      <h2>Children's privacy</h2>
      <p>
        [STATE YOUR POLICY: e.g. "This service is not directed at children under
        13 (or 16, depending on jurisdiction), and we do not knowingly collect
        data from them."]
      </p>

      <h2>Contact</h2>
      <p>Questions about this policy: [YOUR CONTACT EMAIL]</p>
    </main>
  );
}
