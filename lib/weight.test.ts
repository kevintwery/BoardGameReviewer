import { describe, it, expect } from "vitest";
import { formatWeight } from "@/lib/weight";

describe("formatWeight", () => {
  it("returns null when BGG has no weight votes (0)", () => {
    expect(formatWeight(0)).toBeNull();
  });

  it("rounds to one decimal place", () => {
    expect(formatWeight(2.4371)?.value).toBe("2.4");
  });

  it("labels weights across BGG's light-to-heavy scale", () => {
    expect(formatWeight(1.2)?.label).toBe("Light");
    expect(formatWeight(2.2)?.label).toBe("Medium-light");
    expect(formatWeight(3.0)?.label).toBe("Medium");
    expect(formatWeight(3.9)?.label).toBe("Medium-heavy");
    expect(formatWeight(4.6)?.label).toBe("Heavy");
  });
});
