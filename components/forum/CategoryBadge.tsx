type Category = "RULE_CLARIFICATION" | "HOUSE_RULES" | "STRATEGY";

// Centralizing label + color per category here means adding a 4th
// category later is a one-line change instead of hunting through every
// component that renders a badge.
const CATEGORY_STYLES: Record<Category, { label: string; className: string }> = {
  RULE_CLARIFICATION: {
    label: "Rule Clarification",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  HOUSE_RULES: {
    label: "House Rules",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  STRATEGY: {
    label: "Strategy",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
};

export function CategoryBadge({ category }: { category: Category }) {
  const style = CATEGORY_STYLES[category];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}
