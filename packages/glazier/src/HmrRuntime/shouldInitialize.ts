/**
 * Determines if the HMR runtime should be initialized.
 * Ensures that HMR is enabled and that the runtime hasn't been initialized before.
 *
 * @internal scope: module
 */
const __knytHmrInitialized = Symbol.for("knyt.luthier.hmr.initialized");

/**
 * Determines if the HMR runtime should be initialized.
 * Ensures that HMR is enabled and that the runtime hasn't been initialized before.
 *
 * @returns {boolean} - True if HMR runtime should be initialized, false otherwise.
 *
 * @remarks
 *
 * A global symbol is used to track initialization status, preventing multiple initializations
 * across different modules or bundles.
 */
export function shouldInitialize(): boolean {
  if (!import.meta.hot) {
    console.info("HMR not enabled.");
    return false;
  }
  if (Object.hasOwn(globalThis, __knytHmrInitialized)) {
    console.info("Knyt HMR Runtime already initialized.");
    return false;
  }

  Object.defineProperty(globalThis, __knytHmrInitialized, { value: true });

  return true;
}
