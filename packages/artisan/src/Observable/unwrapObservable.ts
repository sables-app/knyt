import { ObservableUnwrapped } from "./ObservableUnwrapped.ts";
import type { Observable } from "./types.ts";

/**
 * Extracts an optional nested observable from a source observable.
 *
 * @beta This API is experimental and may change in future releases without notice.
 */
/*
 * ### Private Remarks
 *
 * Overload signatures are used to ensure proper type inference.
 * The `ObservableUnwrapped.Params` type is too complex for TypeScript
 * to infer correctly without them.
 */

export function unwrapObservable<T>(
  origin: Observable<Observable<T>>,
): Observable.WithSubscription<T>;

/**
 * Unwrap a nested observable that may be `undefined`.
 *
 * @alpha This API is experimental and may change in future releases without notice.
 */
export function unwrapObservable<T, U>(
  origin: Observable<U>,
  derive: ObservableUnwrapped.DeriveHandler<T, U>,
): Observable.WithSubscription<T>;

export function unwrapObservable<T, U>(
  origin: Observable<U>,
  derive?: ObservableUnwrapped.DeriveHandler<T, U>,
): Observable.WithSubscription<T> {
  return new ObservableUnwrapped(origin, derive);
}
