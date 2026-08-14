import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isModerator } from "@/lib/moderation";
import { BggImportSearch } from "@/components/admin/BggImportSearch";

// Same server-side gate pattern as app/admin/reports/page.tsx — see the
// comment there for why this is a UX guard, not the real security
// boundary (that lives in the /api/admin/bgg/* routes).
export default async function AdminImportGamesPage() {
  const { userId } = await auth();

  if (!userId || !(await isModerator(userId))) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold">Add Games from BoardGameGeek</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Search BGG by name and import a game into the catalog. Already-imported
        games are marked so you don't accidentally duplicate work.
      </p>

      <div className="mt-6">
        <BggImportSearch />
      </div>
    </main>
  );
}
