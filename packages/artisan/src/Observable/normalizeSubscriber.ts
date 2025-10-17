import { assertObserver } from "./typeGuards.ts";
import type { Observable, Observer } from "./types.ts";

/**
 * Normalizes subscribe input to an observer.
 *
 * @internal scope: workspace
 */
/*
 * ### Private Remarks
 *
 * This should be used to normalize the input to a `subscribe` method
 * right before it is invoked in response to a update from an observable.
 *
 * This is because the input to the `subscribe` method can be a function
 * or an observer object, and the input itself must be wrapped in a WeakRef
 * to prevent memory leaks.
 */
export function normalizeSubscriber<T>(
  input: Observable.Subscriber<T>,
): Observer<T>;

export function normalizeSubscriber<T>(
  input: Observable.Subscriber<T> | undefined,
): Observer<T> | undefined;

export function normalizeSubscriber<T>(
  input: Observable.Subscriber<T> | undefined,
): Observer<T> | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (typeof input === "function") {
    return { next: input };
  }

  // TODO: Remove in production build
  assertObserver(input);

  return input;
}
