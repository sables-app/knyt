import type { Observable, Observer } from "./types";

export function isObserver<T = unknown>(value: unknown): value is Observer<T> {
  return (
    // NOTE: Knyt doesn't support functions being used as a namespace
    // for an observer. An observer must be satisfy a `typeof value == "object"`
    // check, and have a `next` method.
    //
    // Supporting functions as observers would require a level of complexity
    // that just isn't worth it. With that said, `Subscribers` can be either a
    // function or an object, so there should be little to no cases where
    // a function would need to be used as base for an observer.
    typeof value == "object" &&
    value != null &&
    "next" in value &&
    typeof (value as Observer<T>).next === "function"
  );
}

export function assertObserver<T = unknown>(
  value: unknown,
): asserts value is Observer<T> {
  if (!isObserver(value)) {
    throw new TypeError("Expected an observer");
  }
}

export function isObservable<T = unknown>(
  value: unknown,
): value is Observable<T> {
  return (
    // NOTE: Unlike observers, Knyt supports functions being used as a namespace
    // for an observable.
    ((typeof value === "object" && value != null) ||
      typeof value === "function") &&
    "subscribe" in value &&
    typeof (value as Observable<T>).subscribe === "function" &&
    "asInterop" in value &&
    typeof (value as Observable<T>).asInterop === "function"
  );
}

export function assertObservable<T = unknown>(
  value: unknown,
): asserts value is Observable<T> {
  if (!isObservable(value)) {
    throw new TypeError("Expected an observable");
  }
}
