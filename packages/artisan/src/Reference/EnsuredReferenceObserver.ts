import {
  normalizeSubscriber,
  type Observable,
  type Observer,
  type Subscription,
} from "../Observable/mod.ts";
import type { Reference } from "./types.ts";

/**
 * An observer that wraps a reference for a potential subscriber,
 * passing updates to the latest subscriber available in the reference.
 *
 * @remarks
 *
 * An observer created from an reference that may contain a subscriber for another reference.
 * Mimics the behavior of a Reference, by notifying the subscriber of the latest value,
 * when the subscriber reference changes.
 *
 * @internal scope: workspace
 */

// TODO: Determine whether this should be replaced by `DynamicObserver`,
// or clearly document the differences between the two.
// `DynamicObserver` is designed to be used with any observable, while
// `EnsuredReferenceObserver` only accepts a reference.

export class EnsuredReferenceObserver<T> implements Observer<T> {
  /**
   * The subscriber that is being proxied to.
   */
  #currentSubscriber: Observable.Subscriber<T> | undefined;

  /**
   * The subscription to the subscriber reference.
   */
  #subscription: Subscription;

  /**
   * A reference to the latest value emitted by the observer.
   * This is used to notify the subscriber of the latest value,
   * when the subscriber reference changes.
   *
   * The value is stored in an object to allow for `undefined` values
   * to be stored.
   */
  #latestValue: { value: T } | undefined;

  #latestError: { error: unknown } | undefined;

  #hasCompleted = false;

  /**
   * The observer to the subscriber reference.
   */
  #subscriberObserver = {
    next: (currentSubscriber: Observable.Subscriber<T> | undefined) => {
      this.#currentSubscriber = currentSubscriber;

      // All side-effects should be asynchronous.
      queueMicrotask(() => {
        // If there is a latest value, notify the current subscriber
        if (this.#latestValue) {
          // Notify the subscriber of the latest value immediately.
          // This is done to ensure that the current subscriber is always up-to-date.
          normalizeSubscriber(this.#currentSubscriber)?.next(
            this.#latestValue.value,
          );
        }

        // If there is a latest error, notify the current subscriber
        if (this.#latestError) {
          // Notify the subscriber of the latest error immediately.
          // This is done to ensure that the current subscriber is always up-to-date.
          normalizeSubscriber(this.#currentSubscriber)?.error?.(
            this.#latestError.error,
          );
        }

        // If the consuming observable has completed, notify the subscriber.
        if (this.#hasCompleted) {
          normalizeSubscriber(this.#currentSubscriber)?.complete?.();
        }
      });
    },
  };

  /**
   * Retains a strong reference to the subscriber
   * so that it doesn't get garbage collected.
   */
  readonly #subscriber$: Reference.Readonly<
    Observable.Subscriber<T> | undefined
  >;

  constructor(
    subscriber$: Reference.Readonly<Observable.Subscriber<T> | undefined>,
  ) {
    this.#subscriber$ = subscriber$;
    this.#subscription = subscriber$.subscribe(this.#subscriberObserver);
  }

  next(value: T): void {
    this.#latestValue = { value };

    normalizeSubscriber(this.#currentSubscriber)?.next(value);
  }

  error(error: unknown): void {
    this.#latestError = { error };

    normalizeSubscriber(this.#currentSubscriber)?.error?.(error);
  }

  complete(): void {
    this.#hasCompleted = true;

    normalizeSubscriber(this.#currentSubscriber)?.complete?.();
  }
}
