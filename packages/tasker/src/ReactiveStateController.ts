import type { Subscription } from "@knyt/artisan";
import { Store } from "@knyt/clerk";

import type { ReactiveController, ReactiveControllerHost } from "./ReactiveController";

/**
 * A controller that manages the state for a host component.
 *
 * @remarks
 *
 * This is hybrid class that extends `Store` and implements `ReactiveController`,
 * allowing it to manage state and trigger updates on the host component.
 *
 * This type of controller is useful for simple cases of needing to coordinate state between
 * a host and a store in a reactive way.
 *
 * However, more complex cases should use a `Store` and a `ReactiveController` separately.
 *
 * An instance of the controller should be added to a host upon construction so that it can be connected and disconnected
 * from the host's lifecycle. However, the controller instance may be added and removed from the host at any time.
 * In the case that the controller is added after the host is connected, the `hostConnected` lifecycle method should be called manually.
 *
 * @see ObservableSubscriptionController For an alternative controller that subscribes to a store and requests an update when the store changes.
 *
 * @deprecated Use a `Store` and a `ReactiveController` separately
 */
export abstract class ReactiveStateController<
    S,
    H extends ReactiveControllerHost = ReactiveControllerHost,
  >
  extends Store<S>
  implements ReactiveController
{
  protected readonly host: H;

  protected isHostConnected = false;

  /** @internal scope: package */
  #hostUpdateSubscription?: Subscription;

  /**
   * Handles the store update by requesting an update on the host.
   *
   * @remarks
   *
   * This handler must be referenced so that it isn't garbage collected.
   */
  #handleStoreUpdate = () => {
    this.host.requestUpdate();
  };

  /** @public */
  constructor(host: H, initialState: S) {
    super(initialState);

    this.host = host;

    host.addController(this);
  }

  /**
   * Sets up a subscription the host's subscription to the store.
   *
   * @remarks
   *
   * This method is typically called in the `hostConnected` lifecycle method,
   * but is available to be called manually if needed.
   * For example, if the controller is added after the host is connected,
   * then this method should be called manually.
   *
   * This method is idempotent.
   *
   * TODO: Determine if this method should be public.
   * The common accepted pattern seems to expect external code to call the `hostConnected` callbacks.
   */
  #setupHostSubscription() {
    if (this.#hostUpdateSubscription) return;

    this.#hostUpdateSubscription = this.subscribe(this.#handleStoreUpdate);
  }

  /**
   * Tears down the host's subscription to the store.
   *
   * @remarks
   *
   * This method is typically called in the `hostDisconnected` lifecycle method,
   * but is available to be called manually if needed.
   * For example, if the controller is removed before the host is disconnected,
   * then this method should be called manually.
   *
   * This method is idempotent.
   *
   * TODO: Determine if this method should be public.
   * The common accepted pattern seems to expect external code to call the `hostDisconnected` callbacks.
   */
  #teardownHostSubscription() {
    this.#hostUpdateSubscription?.unsubscribe();
    this.#hostUpdateSubscription = undefined;
  }

  /**
   * @see ReactiveController
   * @public
   */
  public hostConnected(): void {
    this.#setupHostSubscription();
  }

  /**
   * @see ReactiveController
   * @public
   */
  public hostDisconnected(): void {
    this.#teardownHostSubscription();
  }
}
