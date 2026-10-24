interface GameTypeTagsProps {
  // BGG categories, e.g. ["Card Game", "Fantasy"] — what players think of
  // as the "type" of game.
  categories: string[];
  // Cap for tight spaces like the browse grid; omit to show them all.
  limit?: number;
  size?: "sm" | "md";
}

export function GameTypeTags({ categories, limit, size = "md" }: GameTypeTagsProps) {
  if (categories.length === 0) return null;

  const shown = limit ? categories.slice(0, limit) : categories;
  const hiddenCount = categories.length - shown.length;
  const sizeClass = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <ul className="flex flex-wrap gap-1" aria-label="Game type">
      {shown.map((category) => (
        <li
          key={category}
          className={`rounded-full bg-slate-100 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 ${sizeClass}`}
        >
          {category}
        </li>
      ))}
      {hiddenCount > 0 && (
        <li className={`text-slate-500 dark:text-slate-400 ${sizeClass}`}>+{hiddenCount}</li>
      )}
    </ul>
  );
}
