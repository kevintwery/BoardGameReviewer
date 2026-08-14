import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

/**
 * A general contact/support channel, deliberately separate from the
 * forum's "Report" button (see components/forum/ReportButton.tsx and
 * app/admin/reports). Those are different problems needing different
 * handling: "this specific post is harassment" goes to the moderation
 * queue for review against that content; "the site is broken" or "I
 * have a billing question" needs a person, not a queue of forum reports
 * to sift through.
 *
 * This starts as a plain mailto link rather than a form + email-sending
 * API route — no email infrastructure to stand up, and a mailto link
 * costs nothing to maintain. Worth upgrading to a real form (with
 * server-side sending via Resend/Postmark/etc.) once contact volume
 * justifies it.
 */
export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "support@example.com";

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold">Contact &amp; Support</h1>

      <div className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-400">
        <p>
          Found a bug, have a question about your account, or need help with
          something that isn't a specific forum post? Email us:
        </p>
        <p>
          <a
            href={`mailto:${contactEmail}`}
            className="text-base font-medium text-brand-600 hover:underline dark:text-brand-500"
          >
            {contactEmail}
          </a>
        </p>
        <p>
          Reporting a specific forum post or comment? Use the{" "}
          <span className="font-medium">Report</span> button on that post instead
          — it goes straight to our moderation queue and gets reviewed faster
          than a general email would.
        </p>
      </div>
    </main>
  );
}
