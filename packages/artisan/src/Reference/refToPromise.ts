import { observableToPromise, type ObservablePromise } from "../Observable/mod.ts";
import type { Reference } from "./types.ts";

/**
 * Converts a reference to a promise.
 *
 * @remarks
 *
 * The promise resolves when the reference updates with a value that satisfies
 * the `shouldResolve` function.
 *
 * The promise rejects if the given abort signal is triggered or times out.
 *
 * By default, the promise resolves if the reference contains a truthy value.
 *
 * @public
 */
export function refToPromise<T>(
  reference: Reference.Readonly<T>,
  options?: ObservablePromise.Options<T>,
): Promise<T> {
  return observableToPromise(reference, {
    shouldResolve: Boolean,
    ...options,
  });
}
