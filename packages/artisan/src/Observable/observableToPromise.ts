import { ObservablePromise } from "./ObservablePromise";
import type { Observable } from "./types";

/**
 * Converts an observable to a promise.
 *
 * @remarks
 *
 * The promise resolves when the observable emits a value that satisfies
 * the `shouldResolve` function or when the observable completes with a value.
 * The promise rejects if the observable completes without a value, emits an error,
 * is aborted, or times out.
 *
 * @public
 */
export function observableToPromise<T>(
  observable: Observable<T>,
  options?: ObservablePromise.Options<T>,
): Promise<T> {
  return new ObservablePromise(observable, options).promise;
}
