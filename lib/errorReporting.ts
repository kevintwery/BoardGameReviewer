/**
 * Minimal error-reporting hook for API routes.
 *
 * Right now this just logs to the console, which Vercel captures in its
 * function logs — good enough to debug a handful of users, useless once
 * you actually have traffic (nobody's watching logs in real time, and
 * console logs don't page anyone or track error trends).
 *
 * To upgrade to real monitoring: install `@sentry/nextjs`, run its setup
 * wizard (it writes its own config files), and replace the body of
 * `reportError` below with `Sentry.captureException(error, { extra:
 * context })`. Every call site in the codebase stays the same — this
 * function is the only thing that needs to change.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  console.error("[error]", error, context ?? {});
}

/**
 * Wraps an API route handler so unexpected exceptions get logged and
 * turned into a generic 500 instead of crashing the request with an
 * unhandled error (which, depending on the deployment, can leak a stack
 * trace to the client). Route handlers that expect specific errors
 * (validation failures, auth checks) should keep handling those
 * explicitly — this is a safety net for the unexpected ones.
 *
 * Usage:
 * ```ts
 * export const POST = withErrorReporting(async (request: NextRequest) => {
 *   // ... route logic that might throw
 * });
 * ```
 */
export function withErrorReporting<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      reportError(error, { args: args.length });
      return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}
