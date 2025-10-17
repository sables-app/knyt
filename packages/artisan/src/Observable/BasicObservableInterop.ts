import type {
  Observable,
  ObservableInterop,
  Observer,
  Subscription,
} from "./types.ts";

/**
 * Wraps a partial observer to ensure that it implements the Observer interface.
 */
class EnsuredObserver<T> implements Observer<T> {
  #partialObserver: Partial<Observer<T>>;

  constructor(partialObserver: Partial<Observer<T>>) {
    this.#partialObserver = partialObserver;
  }

  next(value: T): void {
    this.#partialObserver.next?.(value);
  }

  error(error: unknown): void {
    this.#partialObserver.error?.(error);
  }

  complete(): void {
    this.#partialObserver.complete?.();
  }
}

/**
 * A basic implementation of the ObservableInterop interface that wraps an
 * underlying Observable and ensures that observers are not garbage collected
 * while they are subscribed.
 */
export class BasicObservableInterop<T> implements ObservableInterop<T> {
  /**
   * The underlying observable that this interop wraps.
   *
   * @remarks
   *
   * This property serves two purposes:
   * 1. It provides a reference to the original observable, allowing the interop
   *    to delegate subscription and notification logic to it.
   * 2. It ensures that the observable is not garbage collected while there are
   *    active subscriptions, as the interop holds a strong reference to it.
   */
  readonly #observable: Observable<T>;

  /**
   * Retains strong references to `EnsuredObserver` instances to ensure
   * they are not garbage collected while they are subscribed to the observable.
   */
  readonly #observers = new Set<Observer<T>>();

  #terminationObserver: Observer<T> = {
    next: () => {
      // Do nothing on next, as we are only interested in termination.
      // The next handler is required to implement the Observer interface.
    },
    error: (error: unknown) => {
      // When an error occurs, clear all observers so they can be garbage collected.
      this.#observers.clear();
    },
    complete: () => {
      // When the observable completes, clear all observers so they can be garbage collected.
      this.#observers.clear();
    },
  };

  constructor(observable: Observable<T>) {
    this.#observable = observable;

    this.#observable.subscribe(this.#terminationObserver);
  }

  subscribe(partialObserver: Partial<Observer<T>>): Subscription {
    const observer = new EnsuredObserver<T>(partialObserver);

    this.#observers.add(observer);

    const subscription = this.#observable.subscribe(observer);

    return {
      unsubscribe: () => {
        subscription.unsubscribe();
        // Remove the observer from the set to allow it to be garbage collected.
        this.#observers.delete(observer);
      },
    };
  }
}
