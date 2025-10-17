import type { Observable, Observer, Subscription } from "@knyt/artisan";

import type {
  ReactiveController,
  ReactiveControllerHost,
} from "./ReactiveController.ts";

/**
 * A controller and observer that requests a host update when a new value is received.
 *
 * @remarks
 *
 * This controller maintains strong references to the observable, host, and itself as the observer.
 * As long as the host is connected, the subscription remains active. By acting as its own observer,
 * the controller ensures it is not garbage collected while attached to the host. When the host is
 * discarded, the observer and its subscription are also discarded.
 */
export class HostUpdater implements ReactiveController, Observer<unknown> {
  readonly #host: ReactiveControllerHost;
  readonly #originalSubscription: Subscription;

  /**
   * Retrain a strong reference to the observable.
   */
  readonly #retainedObservable: Observable<unknown> | undefined;

  readonly subscription: Subscription = {
    unsubscribe: () => {
      this.#originalSubscription.unsubscribe();
      this.#host.removeController(this);
    },
  };

  constructor(host: ReactiveControllerHost, observable: Observable<unknown>) {
    this.#host = host;

    host.addController(this);

    // Begin tracking the observable immediately.
    this.#originalSubscription = observable.subscribe(this);

    /**
     * The controller retains a strong reference to the observable,
     * preventing it from being garbage collected and ensuring the subscription
     * stays active as long as the host exists.
     */
    this.#retainedObservable = observable;
  }

  next(): void {
    this.#host.requestUpdate();
  }

  hostConnected?: () => void;
}
