import { Beacon } from "./Beacon.ts";
import type { Observable } from "./types.ts";

/**
 * Convert a promise into an observable.
 *
 * @public
 */
export function promiseToObservable<T>(promise: Promise<T>): Observable<T> {
  return new Beacon<T>(async ({ next, complete, error }) => {
    try {
      next(await promise);
      // Immediately notify completion after the value is emitted,
      // because the promise is resolved.
      complete();
    } catch (err) {
      // We don't call complete() here, because the `error` signal
      // terminates the observable.
      error(err);
    }
  });
}
