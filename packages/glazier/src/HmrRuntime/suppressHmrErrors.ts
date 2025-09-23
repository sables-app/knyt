/**
 * Global symbol used by Bun to store the HMR handler function.
 *
 * @see https://github.com/oven-sh/bun/blob/7521e45b17830e39cfcb271f98c8e686b43ebb7f/src/bake/hmr-runtime-client.ts#L69
 */
const __bunHmr = Symbol.for("bun:hmr");

/**
 * Suppresses benign HMR errors in Bun's HMR runtime.
 *
 * @remarks
 *
 * Some errors thrown by Bun's HMR runtime are harmless and can be
 * safely ignored. This function wraps the original HMR handler to catch
 * and suppress these specific errors, preventing them from cluttering
 * the console and covering the screen with verbose error messages.
 */

// TODO: Remove this workaround when either Bun fixes the issue or
// I figure out a better solution (or solve the underlying problem).
export function suppressHmrErrors(): void {
  const originalBunHmr = (globalThis as any)[__bunHmr];

  if (!originalBunHmr) return;

  function wrappedBunHmr(...args: any[]): void {
    try {
      originalBunHmr(...args);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Unknown HMR script:")
      ) {
        // This error is benign and can be ignored.
        //
        // If not suppressed, Bun's error overlay will obscure the UI
        // with a verbose message, making development difficult.
        //
        // Logging a warning instead keeps developers informed
        // without interrupting their workflow. No action is needed,
        // as this is an internal HMR issue that does not affect app functionality.
        //
        // See the source of the error in Bun's codebase:
        // https://github.com/oven-sh/bun/blob/7521e45b17830e39cfcb271f98c8e686b43ebb7f/src/bake/hmr-runtime-client.ts#L71
        console.warn(error.message);
        return;
      }

      throw error;
    }
  }

  (globalThis as any)[__bunHmr] = wrappedBunHmr;
}
