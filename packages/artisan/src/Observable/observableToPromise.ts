import { ObservablePromise } from "./ObservablePromise.ts";
import type { Observable } from "./types.ts";

/**
 * Converts an observable to a promise.
 *
 * @remarks
 *
 * The promise resolves when the observable emits a value that satisfies
 * the `shouldResolve` function or when the observable completes with a value.
 *
 * The promise rejects if the:
 *
 * 1. Observable completes without a value
 * 2. Observable emits an error
 * 3. AbortSignal is aborted
 * 4. Operation times out
 *
 * By default, the promise resolves with the first emitted value.
 *
 * @public
 */
export function observableToPromise<T>(
  observable: Observable<T>,
  options?: ObservablePromise.Options<T>,
): Promise<T> {
  return new ObservablePromise(observable, options).promise;
}
