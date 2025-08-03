const __isServerSide = Symbol.for("knyt.artisan.isServerSide");

/**
 * Detect if the code is running in a server-side environment.
 * This is useful for libraries that need to behave differently
 * in server-side and client-side environments.
 *
 * @remarks
 *
 * The default behavior is to assume that the code is running
 * in a "server-side" environment if `window` is not defined.
 */
/*
 * ### Private Remarks
 *
 * If `window` is defined, we assume a browser-like (client-side) environment,
 * including environments like JSDOM. Otherwise, it's considered server-side.
 * Note: Knyt's Bun plugin does not define `window`, so this returns `true` in Bun.
 */
export function isServerSide(): boolean {
  if (typeof (globalThis as any)[__isServerSide] === "boolean") {
    return (globalThis as any)[__isServerSide];
  }

  return typeof globalThis.window === "undefined";
}

/**
 * Detect if the code is running in a client-side environment.
 * This is useful for libraries that need to behave differently
 * in server-side and client-side environments.
 *
 * @remarks
 *
 * This is the opposite of `isServerSide()`.
 *
 * @see {@link isServerSide}
 */
export function isClientSide(): boolean {
  return !isServerSide();
}

/**
 * Override the default server-side check.
 */
export function setServerSide(value: boolean): void {
  (globalThis as any)[__isServerSide] = value;
}

/**
 * Remove the server-side check override.
 */
export function unsetServerSide(): void {
  delete (globalThis as any)[__isServerSide];
}
