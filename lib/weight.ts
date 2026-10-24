/**
 * Turns BGG's 1–5 "weight" (average community complexity vote) into
 * display text. BGG reports 0 when nobody has voted yet, which we treat
 * as unknown rather than "super light".
 */
export function formatWeight(bggWeight: number): { value: string; label: string } | null {
  if (!bggWeight || bggWeight <= 0) return null;

  // Bands follow BGG's own vote labels (1 Light … 5 Heavy).
  const label =
    bggWeight < 1.8
      ? "Light"
      : bggWeight < 2.6
        ? "Medium-light"
        : bggWeight < 3.4
          ? "Medium"
          : bggWeight < 4.2
            ? "Medium-heavy"
            : "Heavy";

  return { value: bggWeight.toFixed(1), label };
}
