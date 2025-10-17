import type { Observable, Subscription } from "./types.ts";

/**
 * Subscribes to an observable and retains a reference to the subscriber.
 *
 * @see {@link Subscription.SubscriberRetaining}
 *
 * @internal scope: workspace
 */
export function subscribeWithRetention<T>(
  observable: Observable<T>,
  subscriber: Observable.Subscriber<T>,
): Subscription.SubscriberRetaining<T> {
  const subscription = observable.subscribe(subscriber);

  return {
    subscriber,
    unsubscribe() {
      subscription.unsubscribe();
    },
  };
}
