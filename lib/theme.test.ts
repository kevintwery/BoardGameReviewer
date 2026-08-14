// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getStoredTheme, applyTheme } from "@/lib/theme";

describe("getStoredTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the stored theme when one was previously saved", () => {
    window.localStorage.setItem("theme", "dark");
    expect(getStoredTheme()).toBe("dark");
  });

  it("ignores garbage values in storage and falls back to OS preference", () => {
    window.localStorage.setItem("theme", "not-a-real-theme");
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: false } as MediaQueryList);

    expect(getStoredTheme()).toBe("light");
  });

  it("falls back to the OS 'prefers dark' setting when nothing is stored", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    expect(getStoredTheme()).toBe("dark");
  });

  it("falls back to light when the OS has no dark preference and nothing is stored", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: false } as MediaQueryList);
    expect(getStoredTheme()).toBe("light");
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("adds the 'dark' class to <html> and persists the choice when applying dark", () => {
    applyTheme("dark");

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("theme")).toBe("dark");
  });

  it("removes the 'dark' class and persists the choice when applying light", () => {
    document.documentElement.classList.add("dark");

    applyTheme("light");

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem("theme")).toBe("light");
  });
});
