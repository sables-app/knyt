import { normalizeSubscriber } from "./normalizeSubscriber";
import type { Observable, Observer } from "./types";

/**
 * Combines multiple subscribers into a single observer.
 *
 * @public
 */
export function combineSubscribers<T>(
  ...subscribers: ReadonlyArray<Observable.Subscriber<T> | undefined>
): Observer<T> {
  return {
    next(value: T): void {
      for (const subscriber of subscribers) {
        normalizeSubscriber(subscriber)?.next(value);
      }
    },
    error(error: unknown): void {
      for (const subscriber of subscribers) {
        normalizeSubscriber(subscriber)?.error?.(error);
      }
    },
    complete(): void {
      for (const subscriber of subscribers) {
        normalizeSubscriber(subscriber)?.complete?.();
      }
    },
  };
}
