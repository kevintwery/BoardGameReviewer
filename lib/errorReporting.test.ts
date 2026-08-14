import { describe, it, expect, vi, beforeEach } from "vitest";
import { reportError, withErrorReporting } from "@/lib/errorReporting";

describe("reportError", () => {
  it("logs the error to the console", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    reportError(new Error("something broke"), { route: "/api/test" });

    expect(consoleSpy).toHaveBeenCalledWith(
      "[error]",
      expect.any(Error),
      { route: "/api/test" }
    );
    consoleSpy.mockRestore();
  });
});

describe("withErrorReporting", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("passes through a successful handler's response unchanged", async () => {
    const handler = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });
    const wrapped = withErrorReporting(handler);

    const response = await wrapped();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("catches a thrown error and returns a generic 500 instead of crashing", async () => {
    const handler = async () => {
      throw new Error("unexpected failure");
    };
    const wrapped = withErrorReporting(handler);

    const response = await wrapped();

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toMatch(/something went wrong/i);
  });

  it("does not leak the original error message to the response body", async () => {
    const handler = async () => {
      throw new Error("SECRET: database password is hunter2");
    };
    const wrapped = withErrorReporting(handler);

    const response = await wrapped();
    const body = await response.json();

    expect(JSON.stringify(body)).not.toContain("hunter2");
  });
});
