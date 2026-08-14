import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isModerator } from "@/lib/moderation";
import { ReportQueue } from "@/components/admin/ReportQueue";

// Server-side gate: this runs before anything renders, so a non-moderator
// never even receives the page's HTML/JS. The API routes underneath
// (/api/moderation/*) enforce the same check independently — this page
// guard is about UX (don't show the page at all), not the actual security
// boundary, which lives in the routes.
export default async function AdminReportsPage() {
  const { userId } = await auth();

  if (!userId || !(await isModerator(userId))) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold">Moderation Queue</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Reported posts and comments awaiting review.
      </p>

      <div className="mt-6">
        <ReportQueue />
      </div>
    </main>
  );
}
