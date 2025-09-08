import {
  Beacon,
  normalizeSubscriber,
  OBSERVABLE_PROPERTY_NAME,
  type Observable,
  type ObservableInterop,
  type Subscription,
} from "../Observable/mod";
import { strictEqual } from "../utils/mod";
import { __isKnytReference } from "./typeGuards";
import type { Reference } from "./types";

/**
 * A basic `Reference` implementation.
 *
 * @internal scope: workspace
 */
/*
 * ### Private Remarks
 *
 * There are three occurrences in which a reference will notify subscribers:
 * 1. When the reference is created, the initial value is set.
 * 2. When the reference is updated, the new value is set.
 * 3. When a subscriber subscribes to the reference, the current value is
 *    immediately sent to the subscriber.
 */
export class BasicReference<T> implements Reference<T> {
  /**
   * The `Beacon` instance used to notify subscribers.
   */
  readonly #emitter = Beacon.withEmitter<T>();

  /**
   * @remarks
   *
   * The initial value is set in the constructor by the `set` method.
   * This is done to ensure that the `onUpdate` callback is called
   * when the initial value is set.
   *
   * @internal scope: package
   */
  #currentValue!: T;

  /**
   * @internal scope: package
   */
  readonly #onUpdate: Reference.UpdateHandler<T> | undefined;

  readonly #comparator: Reference.Comparator<T> | undefined;

  constructor(options: BasicReference.Options<T>) {
    const { initialValue, onUpdate, comparator } = options;

    this.#onUpdate = onUpdate;
    this.#comparator = comparator;

    // Immediately set the initial value after the ref object is constructed
    this.#set(initialValue, true);
  }

  get value(): T {
    return this.#currentValue;
  }

  set value(nextValue: T) {
    this.set(nextValue);
  }

  // This is a detachable method.
  readonly get = (): T => {
    return this.#currentValue;
  };

  // This is a detachable method.
  readonly set = (nextValue: T): void => {
    this.#set(nextValue);
  };

  // NOTE: This is not considered detachable method, even though it is an arrow function.
  next = this.set;

  /**
   * A set of temporary subscribers used to track subscriptions during the
   * initial subscription phase. This prevents emitting the current value to
   * subscribers that are already being notified of a change, avoiding duplicate
   * notifications when subscribing during an update.
   *
   * Keeping subscribers in this set ensures they are not garbage collected
   * before the initial notification, preventing missed updates in rare cases.
   *
   * Subscribers are removed from this set once the initial subscription phase
   * is finished.
   */
  #trackers = new Set<Observable.Subscriber<unknown>>();

  subscribe(subscriber: Observable.Subscriber<T>): Subscription {
    /**
     * Indicates whether the beacon has emitted a value
     * since the subscription started.
     */
    let hasEmitted = false;

    const tracker: Observable.Subscriber<unknown> = () => {
      hasEmitted = true;
    };

    this.#trackers.add(tracker);

    const trackerSubscription = this.#emitter.beacon.subscribe(tracker);
    const subscription = this.#emitter.beacon.subscribe(subscriber);

    // All side-effects should be asynchronous.
    // A Ref defers side-effects until the next microtask.
    queueMicrotask(() => {
      this.#trackers.delete(tracker);
      trackerSubscription.unsubscribe();

      // Prevent sending the current value to the subscriber if the beacon
      // has already emitted a value since the subscription began.
      //
      // This avoids duplicate notifications, which can happen if a subscriber
      // is added during an ongoing change. Without this check, the subscriber
      // would receive the current value both immediately and again when the
      // change is processed.
      //
      // This scenario often occurs when a subscriber is registered
      // synchronously right after a reference is created and its initial value
      // is set.
      if (hasEmitted) return;

      // Send the current value to the subscriber immediately.
      // This is done to ensure that the subscriber is always up-to-date.
      normalizeSubscriber(subscriber).next(this.#currentValue);
    });

    return subscription;
  }

  asReadonly(): Reference.Readonly<T> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const ref = this;

    return {
      get value(): T {
        return ref.value;
      },
      get: ref.get,
      subscribe: (subscriber) => {
        return ref.subscribe(subscriber);
      },
      get [__isKnytReference]() {
        return true as const;
      },
      asInterop(): ObservableInterop<T> {
        return ref.asInterop();
      },
      [Symbol.observable](): ObservableInterop<T> {
        return ref.asInterop();
      },
      [OBSERVABLE_PROPERTY_NAME](): ObservableInterop<T> {
        return ref.asInterop();
      },
    };
  }

  get [__isKnytReference]() {
    return true as const;
  }

  #set(nextValue: T, isInitialValue = false): void {
    const comparator = this.#comparator ?? strictEqual;
    const previousValue = this.#currentValue;

    // The next value is always set, regardless of the comparator.
    // The comparator is used to determine if change notification
    // should be emitted. Mutating the current value is a separate
    // concern that is not related to the comparator.
    this.#currentValue = nextValue;

    if (
      // Always emit a change notification for the initial value to ensure
      // it is sent to subscribers, regardless of the comparator result.
      // This guarantees the first value is always delivered.
      //
      // Check `isInitialValue` first to avoid passing a non-existent
      // previous value to the comparator. This ensures the comparator
      // only compares valid previous and next values, preventing
      // unexpected behavior.
      !isInitialValue &&
      comparator(previousValue, nextValue)
    ) {
      // If the comparator returns true, no change notification is emitted.
      return;
    }

    // All side-effects should be asynchronous.
    // A Ref defers side-effects until the next microtask.
    queueMicrotask(() => {
      this.#onUpdate?.(nextValue, previousValue);
      this.#emitter.next(nextValue);
    });
  }

  asInterop(): ObservableInterop<T> {
    return this.#emitter.beacon.asInterop();
  }

  [Symbol.observable](): ObservableInterop<T> {
    return this.asInterop();
  }

  [OBSERVABLE_PROPERTY_NAME](): ObservableInterop<T> {
    return this.asInterop();
  }
}

export namespace BasicReference {
  export type Options<T> = {
    initialValue: T;
    /**
     * A callback that is called when the value is updated.
     * It receives the current value and the previous value as arguments.
     *
     * @see {@link Reference.UpdateHandler}
     */
    onUpdate?: Reference.UpdateHandler<T>;
    /**
     * A comparator function that is used to compare the current value
     * and the next value. If the comparator returns `true`, the value
     * is not updated and no subscribers are notified.
     */
    comparator?: Reference.Comparator<T>;
  };
}
