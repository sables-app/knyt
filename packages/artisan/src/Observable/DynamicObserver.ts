import { normalizeSubscriber } from "./normalizeSubscriber.ts";
import type { Observable, Observer, Subscription } from "./types.ts";

/**
 * DynamicObserver is an observer that dynamically updates its
 * current subscriber based on the latest value emitted by an observable.
 * It allows for observing changes in the subscriber and
 * forwarding values to the current subscriber.
 *
 * @alpha This API is experimental and WILL change in the future
 * without a major version bump!
 */

// TODO: Determine whether this should be replaced by `EnsuredReferenceObserver`,
// or clearly document the differences between the two.
// `DynamicObserver` is designed to be used with any observable, while
// `EnsuredReferenceObserver` only accepts a reference.

export class DynamicObserver<T> implements Required<Observer<T>>, Subscription {
  /**
   * This is the observable that will be observed.
   *
   * @remarks
   *
   * This property exists to maintain a strong reference to the observable
   * that is being observed. This prevents the observable from being garbage collected
   * while the dynamic observer is still active.
   */
  #observer$: Observable<Observable.Subscriber<T> | undefined>;
  #currentSubscriber: Observable.Subscriber<T> | undefined;
  #observerSubscription: Subscription;

  get #currentObserver(): Observer<T> | undefined {
    return normalizeSubscriber(this.#currentSubscriber);
  }

  constructor(observer$: Observable<Observable.Subscriber<T> | undefined>) {
    this.#observer$ = observer$;

    this.#observerSubscription = observer$.subscribe({
      next: (currentSubscriber) => {
        this.#currentSubscriber = currentSubscriber;
      },
    });
  }

  next(value: T) {
    this.#currentObserver?.next(value);
  }

  error(err: unknown) {
    this.#currentObserver?.error?.(err);
  }

  complete() {
    this.#currentObserver?.complete?.();
  }

  /**
   * Unsubscribes from observer updates.
   *
   * @remarks
   *
   * Prevents the dynamic observer from replacing the current observer.
   */
  unsubscribe() {
    this.#observerSubscription.unsubscribe();
  }
}
