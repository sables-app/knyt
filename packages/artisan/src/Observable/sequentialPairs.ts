import { normalizeSubscriber } from "./normalizeSubscriber";
import type { Observable, Observer } from "./types";

export type SequentialPair<T> = readonly [previousValue: T, currentValue: T];

class SequentialPairsObserver<T> {
  #previousValue: T;
  #subscriber: Observable.Subscriber<SequentialPair<T>>;

  constructor(
    initialValue: T,
    subscriber: Observable.Subscriber<SequentialPair<T>>,
  ) {
    this.#previousValue = initialValue;
    this.#subscriber = subscriber;
  }

  next(currentValue: T) {
    const pair: SequentialPair<T> = [this.#previousValue, currentValue];

    normalizeSubscriber(this.#subscriber).next(pair);

    this.#previousValue = currentValue;
  }
}

/**
 * Creates an observer that emits sequential pairs of values.
 *
 * @example
 *
 * ```ts
 * import { createReference, sequentialPairs } from "@knyt/artisan";
 *
 * const observer = sequentialPairs(0, ([previousValue, currentValue]) => {
 *   // Handle the sequential pair
 * })
 *
 * createReference(0).subscribe(observer);
 *
 * @alpha This API is experimental and may change in future releases without notice.
 */
// TODO: Consider refactoring this to create an `Observable` instead of an `Observer`.
export function sequentialPairs<T>(
  initialValue: T,
  subscriber: Observable.Subscriber<SequentialPair<T>>,
): Observer<T> {
  return new SequentialPairsObserver(initialValue, subscriber);
}
