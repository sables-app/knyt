import {
  MergedObservable,
  type InferObservablesValue,
} from "./MergedObservable";
import type { Observable } from "./types";

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
