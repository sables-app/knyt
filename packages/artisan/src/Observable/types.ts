import type { OBSERVABLE_PROPERTY_NAME } from "./ObservableProtocol.ts";

/**
 * An object that subscribes to an observable.
 */
export type Observer<T> = {
  /**
   * A function that receives the next value.
   *
   * @inseparable It is not expected for this method to be detachable.
   */
  next: Observer.NextHandler<T>;
  /**
   * A function that receives an error.
   *
   * @inseparable It is not expected for this method to be detachable.
   */
  error?: Observer.ErrorHandler;
  /**
   * A function that receives a completion signal.
   *
   * @inseparable It is not expected for this method to be detachable.
   */
  complete?: Observer.CompleteHandler;
};

export namespace Observer {
  /**
   * A function that receives the next value.
   */
  export type NextHandler<T> = (value: T) => void;
  /**
   * A function that receives an error.
   */
  export type ErrorHandler = (error: unknown) => void;
  /**
   * A function that receives a completion signal.
   */
  export type CompleteHandler = () => void;
}

/**
 * A subscription to the store.
 *
 * @public
 */
export type Subscription = {
  /**
   * A standalone function that unsubscribes from value changes.
   *
   * @detachable
   * @public
   */
  readonly unsubscribe: () => void;
};

export namespace Subscription {
  /**
   * A subscription with a reference to the input that was used to subscribe.
   *
   * @remarks
   *
   * The subscription contains a strong reference subscribe input that
   * was used to subscribe to the observable. This is useful when you want
   * to ensure that the subscribe input doesn't get garbage collected,
   * when the observer is dynamically created.
   *
   * As a result, the observer will not be automatically unsubscribed when
   * returned subscription is garbage collected.
   */
  /*
   * ### Private Remarks
   *
   * The name `SubscriberRetaining` is used to indicate that the subscription
   * retains a reference to the observer to prevent it from being garbage
   * collected. As a result, the type shouldn't be renamed to something
   * more generic like `WithSubscriber`, because such as name loses the
   * intention of the type.
   */
  export type SubscriberRetaining<T> = Subscription & {
    /**
     * The input that was used to subscribe to the observable.
     */
    readonly subscriber: Observable.Subscriber<T>;
  };
}

/**
 * An observable that can be subscribed to.
 *
 * @public
 */
export type Observable<T> = {
  /**
   * Subscribes to updates from the observable.
   *
   * @remarks
   *
   * Observables use weak references to store the observers. As a result,
   * when the observers are garbage collected, the observable will automatically
   * unsubscribe them.
   *
   * @returns A subscription that can be used to unsubscribe the handler.
   *
   * @public
   */
  subscribe(input: Observable.Subscriber<T>): Subscription;
  /**
   * Returns an observable that is compatible with libraries that
   * implement the observable protocol.
   *
   * @remarks
   *
   * Observables that implement the `ObservableInterop` type are expected
   * to maintain strong references to observers, allowing them to be used
   * with libraries like RxJS that expect this behavior.
   *
   * @see {@link ObservableInterop}
   */
  asInterop(): ObservableInterop<T>;
  /**
   * Implements the observable protocol.
   */
  [Symbol.observable](): ObservableInterop<T>;
  /**
   * Ensures compatibility with libraries that fallback to using
   * `@@observable` for the observable protocol.
   */
  /*
   * ### Private Remarks
   *
   * This property exists, because instead of always requiring a ponyfill
   * (like the `symbol-observable` package) to use libraries like `rxjs`,
   * I want compatibility with these libraries to "just work" out of the box.
   */
  [OBSERVABLE_PROPERTY_NAME](): ObservableInterop<T>;
};

export namespace Observable {
  /**
   * Input for subscribing to an observable.
   *
   * @public
   */
  export type Subscriber<T> = Observer<T> | Observer.NextHandler<T>;

  /**
   * An observable that has a subscription that when unsubscribed,
   * will complete the observable.
   *
   * @remarks
   *
   * This type should be used when an observable by listening to another
   * source of data, and when the subscription is unsubscribed,
   * the observable should be completed as well.
   */
  export type WithSubscription<T> = Observable<T> & {
    /**
     * A subscription that can be used to complete the observable.
     *
     * @public
     */
    readonly subscription: Subscription;
  };
}

/**
 * An interoperability type for observables that support the observable
 * protocol.
 *
 * @remarks
 *
 * This type enables compatibility with libraries that rely on the
 * observable protocol, such as RxJS.
 *
 * `ObservableInterop` does not require the `next` method to be
 * implemented, and maintains a strong reference to the observer.
 */
/*
 * ### Private Remarks
 *
 * There are two key differences between `Observable` and `ObservableInterop`.
 *
 * First, `ObservableInterop` allows its `subscribe` method to accept a
 * `Partial<Observer<T>>`, offering more flexibility in how observers are
 * specified. In contrast, `Observable<T>` requires at least a `next`
 * handler to be provided.
 *
 * Second, `ObservableInterop` is not expected to use weak references for
 * observers, whereas `Observable<T>` does. As a result, `ObservableInterop`
 * is suitable for interoperability with libraries that expect strong
 * references to observers (such as RxJS), while `Observable<T>` is intended
 * for internal use with weak references to help prevent memory leaks.
 */
export type ObservableInterop<T> = {
  subscribe(observer: Partial<Observer<T>>): Subscription;
};
