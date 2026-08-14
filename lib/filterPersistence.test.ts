// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { loadStoredFilters, saveFilters, type GameListFilters } from "@/lib/filterPersistence";

describe("loadStoredFilters", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the default filters when nothing has been saved", () => {
    expect(loadStoredFilters()).toEqual({ sortBy: "rating", sortOrder: "desc" });
  });

  it("returns previously saved filters", () => {
    window.localStorage.setItem(
      "gameListFilters",
      JSON.stringify({ sortBy: "name", sortOrder: "asc" })
    );

    expect(loadStoredFilters()).toEqual({ sortBy: "name", sortOrder: "asc" });
  });

  it("merges saved filters over the defaults, so a partial save doesn't lose fields", () => {
    window.localStorage.setItem("gameListFilters", JSON.stringify({ sortBy: "name" }));

    expect(loadStoredFilters()).toEqual({ sortBy: "name", sortOrder: "desc" });
  });

  it("falls back to defaults when storage contains invalid JSON", () => {
    window.localStorage.setItem("gameListFilters", "{not valid json");

    expect(loadStoredFilters()).toEqual({ sortBy: "rating", sortOrder: "desc" });
  });
});

describe("saveFilters", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("writes the filters as JSON to localStorage", () => {
    const filters: GameListFilters = { sortBy: "type", sortOrder: "asc", category: "Strategy" };

    saveFilters(filters);

    expect(JSON.parse(window.localStorage.getItem("gameListFilters")!)).toEqual(filters);
  });

  it("round-trips through save and load correctly", () => {
    const filters: GameListFilters = { sortBy: "name", sortOrder: "desc" };

    saveFilters(filters);

    expect(loadStoredFilters()).toEqual(filters);
  });
});
