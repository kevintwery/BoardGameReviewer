interface StarInputProps {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}

/**
 * A row of clickable stars for scoring 1..max. Used for the required
 * overall score (max 10) and each optional sub-rating (max 5), so the
 * same component covers both by just varying `max`.
 */
export function StarInput({ label, value, max, onChange }: StarInputProps) {
  return (
    <div>
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <div className="mt-1 flex gap-1" role="radiogroup" aria-label={label}>
        {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            onClick={() => onChange(star)}
            className={
              star <= value
                ? "text-lg text-amber-500"
                : "text-lg text-slate-300 hover:text-amber-300 dark:text-slate-600"
            }
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
