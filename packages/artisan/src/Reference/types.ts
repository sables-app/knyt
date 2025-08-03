import type { Observable, Observer, Subscription } from "../Observable/mod";
import type { UndefinedXorNull } from "../types/mod";
import type { __isKnytReference } from "./typeGuards";

/**
 * An observable reference to a mutable value that notifies subscribers on changes.
 *
 * @remarks
 *
 * Acts as both an `Observer` (can receive values) and `Observable` (can be subscribed to),
 * enabling use in reactive or event-driven programming models.
 *
 * Key features:
 * - Stores a single current value
 * - Notifies subscribers asynchronously on updates
 * - Provides the current value immediately upon subscription
 * - **Holds observers with weak references** (does not prevent garbage collection)
 *
 * For details and examples please view the [Observable documentation](https://knyt.dev/guide/observables).
 *
 * For comparison, a `Reference` behaves similarly to a `BehaviorSubject` from RxJS, but with
 * a focus on usability and integration with Knyt's reactive programming model.
 */
/*
 * ### Private Remarks
 *
 * References do not have a termination concept, as they are intended
 * to provide continuous access to a current value and notify
 * subscribers of changes. Unlike other observables, which can complete or
 * error and stop emitting values, references always maintain a
 * current value and will emit this value to any new subscriber at any
 * time. References are designed for ongoing value access and updates,
 * not for finite or terminal event streams.
 */
export type Reference<T> = Observer<T> &
  Observable<T> & {
    /**
     * The current value of the reference.
     */
    value: T;
    /**
     * Get the current value of the reference.
     *
     * @detachable
     */
    readonly get: Reference.Accessor<T>;
    /**
     * Update the value of the reference.
     *
     * @detachable
     */
    readonly set: Reference.Mutator<T>;
    /**
     * Creates a readonly facade for the reference.
     *
     * @remarks
     *
     * The readonly facade is a reference that can only be read from,
     * and cannot be updated. The returned readonly facade is a
     * separate object literal from the original reference, but shares
     * the same value and subscriptions as the original reference.
     */
    asReadonly(): Reference.Readonly<T>;
    /**
     * @internal scope: workspace
     */
    readonly [__isKnytReference]: true;
  };

export namespace Reference {
  /**
   * A function that returns a value.
   */
  export type Accessor<T> = () => T;

  /**
   * A function that updates a value.
   */
  export type Mutator<T> = (value: T) => void;

  export type Readonly<T> = Observable<T> & {
    readonly value: T;
    readonly get: Reference.Accessor<T>;
    /**
     * A flag that indicates that the object is a reference.
     */
    readonly [__isKnytReference]: true;
  };

  export namespace Readonly {
    /**
     * A readonly reference that holds an active subscription to a data source.
     *
     * @remarks
     *
     * Represents a value kept in sync with an external data source that emits updates.
     * Provides access to the current value and the underlying subscription, allowing consumers
     * to unsubscribe from updates. This reference is readonly, so its value cannot be updated directly.
     * Unsubscribing stops further updates to the reference, but does not terminate the reference
     * or affect the data source itself.
     *
     * @public
     */
    export type WithSubscription<T> = Readonly<T> & WithSubscriptionMixin;
  }

  type WithSubscriptionMixin = {
    /**
     * Represents the subscription to the underlying observable.
     * Calling this will unsubscribe from the observable, after which
     * the reference will stop receiving updates, emit no further values,
     * and will not create new subscriptions to the underlying observable.
     */
    readonly subscription: Subscription;
  };

  /**
   * Either a value or a reference to a nullable value.
   *
   * @example
   *
   * ```ts
   * type MaybeAnElement = Reference.Maybe<Element>;
   * ```
   */
  /*
   * ### Private Remarks
   *
   * By default, `null` is used to represent the absence of a value,
   * instead of `undefined`, because `null` is most often
   * used to represent the absence of a value in cases where
   * this type is used; i.e. when an element is available
   * in the DOM.
   *
   * Adding`undefined` as a union type was considered, and there is
   * rational for it, with the `NonNullable` type also filtering out
   * both `null` and `undefined`, but it was decided against for simplicity.
   * It's not a good practice to conflate `null` and `undefined`.
   *
   * As a result, either `null` or `undefined` can be used to represent
   * the absence of a value, but `null` is preferred, and both can not
   * be used at the same time.
   */
  export type Maybe<T, U extends null | undefined = null> =
    | T
    | Readonly<T | UndefinedXorNull<U>>;

  /**
   * A callback that's invoked when a value is updated.
   *
   * @param current - The current value.
   * @param previous - The previous value, if it exists. The value is always `undefined` on the first update.
   *
   * @public
   */
  export type UpdateHandler<T> = (
    currentValue: T,
    previousValue: T | undefined,
  ) => void;

  /**
   * Determines whether two values are equal.
   *
   * @public
   */
  export type Comparator<T> = (a: T, b: T) => boolean;

  /**
   * A `Reference` that retains a strong reference to an observer.
   *
   * @see {@link Subscription.SubscriberRetaining}
   */
  export type SubscriberRetaining<T, U = T> = Readonly<T> & {
    readonly subscription: Subscription.SubscriberRetaining<U>;
  };

  /**
   * A reference that holds an active subscription to a data source.
   *
   * @remarks
   *
   * Represents a value kept in sync with an external data source that emits updates.
   * Provides access to the current value and the underlying subscription, allowing consumers
   * to unsubscribe from updates. This reference is writable, so updating its value will
   * also update the data source. Unsubscribing stops further updates to the reference,
   * but does not terminate the reference or affect the data source itself.
   *
   * @public
   */
  export type WithSubscription<T> = Reference<T> & WithSubscriptionMixin;

  /**
   * A readonly reference that is derived from another reference.
   */
  export type Unwrapped<T> = Readonly<T> & {
    /**
     * Represents the subscription to the underlying observable.
     * Calling this will unsubscribe from the observable, after which
     * the reference will stop receiving updates, emit no further values,
     * and will not create new subscriptions to the underlying observable.
     */
    readonly subscription: Subscription;
  };
}

/**
 * A map of readonly references.
 */
export type ReferenceMap<T> = {
  [K in keyof T]: Reference.Readonly<T[K]>;
};

/**
 * Unwraps a reference type to its underlying value.
 *
 * @alpha This API is experimental and subject to change.
 */
export type UnwrapRef<T> = T extends Reference.Readonly<infer U> ? U : T;

export namespace UnwrapRef {
  /**
   * Unwraps a reference type to its underlying value, recursively.
   *
   * @alpha This API is experimental and subject to change.
   */
  export type Deep<T> = T extends Reference.Readonly<infer U> ? Deep<U> : T;
}
