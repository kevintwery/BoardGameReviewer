import Link from "next/link";

interface SortControlsProps {
  currentSort: "name" | "rating" | "type";
  currentOrder: "asc" | "desc";
}

const SORT_OPTIONS: Array<{ value: "name" | "rating" | "type"; label: string }> = [
  { value: "rating", label: "Rating" },
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
];

/**
 * Sort links for the game list page. These are plain links (not buttons
 * with onClick) so sorting works even before JavaScript loads, and so
 * each sorted view has its own shareable URL — the page itself does the
 * actual sorting server-side based on the URL, see app/games/page.tsx.
 */
export function SortControls({ currentSort, currentOrder }: SortControlsProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500 dark:text-slate-400">Sort by:</span>
      {SORT_OPTIONS.map((option) => {
        const isActive = currentSort === option.value;
        // Clicking the already-active sort flips its direction; clicking a
        // different one starts fresh at descending order.
        const nextOrder = isActive && currentOrder === "desc" ? "asc" : "desc";

        return (
          <Link
            key={option.value}
            href={`/games?sort=${option.value}&order=${nextOrder}`}
            className={
              isActive
                ? "rounded-md bg-brand-500 px-3 py-1 text-white"
                : "rounded-md px-3 py-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }
          >
            {option.label}
            {isActive && (currentOrder === "desc" ? " ↓" : " ↑")}
          </Link>
        );
      })}
    </div>
  );
}
