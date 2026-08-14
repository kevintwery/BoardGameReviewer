import Link from "next/link";
import { SearchBox } from "@/components/games/SearchBox";
import { RandomGameButton } from "@/components/games/RandomGameButton";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">Find your next game night</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Ratings, how-to-play videos, and a community that actually answers rules questions.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <SearchBox />
        <div className="flex gap-3">
          <Link
            href="/games"
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Browse all games
          </Link>
          <RandomGameButton />
        </div>
      </div>
    </main>
  );
}
