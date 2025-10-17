import { FilteredObservable } from "./FilteredObservable.ts";
import { isObservable } from "./typeGuards.ts";
import type { Observable } from "./types.ts";

export function filterObservable<T>(
  predicate: (value: T) => boolean,
): (observable: Observable<T>) => Observable.WithSubscription<T>;

export function filterObservable<T>(
  observable: Observable<T>,
  predicate: (value: T) => boolean,
): Observable.WithSubscription<T>;

export function filterObservable<T>(
  arg0: Observable<T> | ((value: T) => boolean),
  arg1?: (value: T) => boolean,
):
  | Observable.WithSubscription<T>
  | ((observable: Observable<T>) => Observable.WithSubscription<T>) {
  if (isObservable(arg0)) {
    if (arg1) {
      return new FilteredObservable<T>(arg0, arg1);
    } else {
      throw new Error(
        "Predicate function is required when passing an observable.",
      );
    }
  }

  return (observable: Observable<T>) => filterObservable<T>(observable, arg0);
}
