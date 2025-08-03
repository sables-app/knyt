type AnyCallback = (...args: any[]) => void;

/**
 * Combines multiple callbacks into a single callback that calls each of the given callbacks.
 */
export function combineCallbacks<T extends AnyCallback>(
  ...callbacksInput: readonly (T | undefined)[]
): T | undefined {
  const callbacks = callbacksInput.filter(
    (callback): callback is T => !!callback,
  );

  // If there are no callbacks, return undefined.
  if (callbacks.length === 0) {
    return undefined;
  }

  // Optimize the case where there is only one callback.
  if (callbacks.length === 1) {
    return callbacks[0];
  }

  return function (this: any, ...args: any[]): void {
    for (const callback of callbacks) {
      callback?.apply(this, args);
    }
  } as T;
}
