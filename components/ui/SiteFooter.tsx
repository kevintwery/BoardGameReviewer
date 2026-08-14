import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 py-8 dark:border-slate-800">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 dark:text-slate-400 sm:flex-row">
        <p>Board Game Review · Game data via BoardGameGeek</p>
        <div className="flex gap-4">
          <Link href="/contact" className="hover:underline">Contact</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
