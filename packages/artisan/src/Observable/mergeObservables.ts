import {
  MergedObservable,
  type InferObservablesValue,
} from "./MergedObservable.ts";
import type { Observable } from "./types.ts";

/**
 * Merges multiple observables into a single observable.
 *
 * @beta
 */
export function mergeObservables<U extends Observable<any>[]>(
  ...observables: U
): Observable<InferObservablesValue<U>> {
  return new MergedObservable(...observables).beacon;
}
