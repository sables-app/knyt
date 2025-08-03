import { BasicObservableInterop } from "./BasicObservableInterop";
import { normalizeSubscriber } from "./normalizeSubscriber";
import { OBSERVABLE_PROPERTY_NAME } from "./ObservableProtocol";
import type {
  Observable,
  ObservableInterop,
  Observer,
  Subscription,
} from "./types";

/**
 * An `Observable` implementation that can be used to emit values
 * and notify subscribers.
 *
 * @internal scope: workspace
 */
export class Beacon<T> implements Observable<T> {
  static withEmitter<T>(): Beacon.WithEmitter<T> {
    let emitter: Beacon.Emitter<T>;

    const beacon = new Beacon<T>((observer) => {
      emitter = observer;
    });

    return {
      next: (value: T): void => {
        emitter.next(value);
      },
      complete: (): void => {
        emitter.complete();
      },
      error: (error: unknown): void => {
        emitter.error(error);
      },
      get hasTerminated(): boolean {
        return emitter.hasTerminated;
      },
      beacon,
    };
  }

  #isTerminated = false;

  /**
   * A set of weak references to the subscribers.
   *
   * @remarks
   *
   * Subscriptions are weakly referenced to prevent memory leaks,
   * as a result, we can't normalize the subscribe input to an observer,
   * because the observer would be garbage collected.
   * We have to normalize the subscribe input when the weak reference
   * is dereferenced.
   */
  #subscribers = new Set<WeakRef<Observable.Subscriber<T>>>();

  constructor(executor: (emitter: Beacon.Emitter<T>) => void) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const beacon = this;

    executor({
      next: (value: T) => {
        this.#emitNextSignal(value);
      },
      complete: () => {
        this.#emitCompleteSignal();
      },
      error: (error: unknown) => {
        this.#emitErrorSignal(error);
      },
      get hasTerminated(): boolean {
        return beacon.#isTerminated;
      },
    });
  }

  /**
   * Subscribes to updates from the observable.
   */
  subscribe(subscriber: Observable.Subscriber<T>): Subscription {
    const weakSubscriber = new WeakRef(subscriber);

    this.#subscribers.add(weakSubscriber);

    return {
      unsubscribe: (): void => {
        this.#subscribers.delete(weakSubscriber);
      },
    };
  }

  /**
   * Synchronously notify all subscribers of a new value.
   */
  #emitNextSignal(value: T): void {
    this.#forEachSubscriber((observer) => observer.next(value));
  }

  /**
   * Synchronously notify all subscribers of completion.
   *
   * @remarks
   *
   * Terminates the observable.
   */
  #emitCompleteSignal(): void {
    this.#forEachSubscriber((observer) => observer.complete?.());

    this.#isTerminated = true;
  }

  /**
   * Synchronously notify all subscribers of an error.
   *
   * @remarks
   *
   * Terminates the observable.
   */
  #emitErrorSignal(error: unknown): void {
    this.#forEachSubscriber((observer) => observer.error?.(error));

    this.#isTerminated = true;
  }

  #forEachSubscriber(handler: (observer: Observer<T>) => void): void {
    if (this.#isTerminated) {
      // The observable is already terminated. Ignoring notification.
      //
      // NOTE: This intentionally does not throw an error, or log a warning.
      // While all procedures _should_ clean up after a termination, we can avoid
      // writing a lot of `!hasTerminated` checks by making the method a no-op
      // when the observable is already terminated.
      return;
    }

    // Copy the current set of subscribers to prevent issues
    // if the set is modified (e.g., subscribers unsubscribe)
    // during iteration.
    const subscribers = Array.from(this.#subscribers);

    for (const weakSubscriber of subscribers) {
      const subscriber = weakSubscriber.deref();

      if (!subscriber) {
        // The subscriber has been garbage collected, remove it from the set.
        this.#subscribers.delete(weakSubscriber);
        continue;
      }

      handler(normalizeSubscriber(subscriber));
    }
  }

  asInterop(): ObservableInterop<T> {
    return new BasicObservableInterop(this);
  }

  [Symbol.observable](): ObservableInterop<T> {
    return this.asInterop();
  }

  [OBSERVABLE_PROPERTY_NAME](): ObservableInterop<T> {
    return this.asInterop();
  }
}

export namespace Beacon {
  export type Emitter<T> = {
    /**
     * Synchronously emits a value to subscribers.
     *
     * @detachable
     */
    next: Observer.NextHandler<T>;
    /**
     * Synchronously emits completion to subscribers, terminating the observable.
     *
     * @detachable
     */
    complete: Observer.CompleteHandler;
    /**
     * Synchronously emits an error to subscribers, terminating the observable.
     *
     * @detachable
     */
    error: Observer.ErrorHandler;
    /**
     * Indicates whether the observable has been terminated.
     *
     * @remarks
     *
     * This is `true` after `complete` or `error` has been called.
     */
    hasTerminated: boolean;
  };

  export type WithEmitter<T> = Emitter<T> & {
    beacon: Observable<T>;
  };
}
