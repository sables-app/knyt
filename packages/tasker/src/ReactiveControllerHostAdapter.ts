import { isClientSide } from "@knyt/artisan";

import type {
  ReactiveController,
  ReactiveControllerHost,
} from "./ReactiveController";

type ReactiveControllerHostAdapterHooks = {
  /**
   * A callback that performs an update of the adapted element or component.
   *
   * @remarks
   *
   * To clarify, this is not the same as `requestUpdate` which is synchronous,
   * and may not perform an update.
   *
   * In contrast, this callback should always perform an update,
   * and it may return a promise that resolves when the update is complete.
   *
   * @internal scope: workspace
   */
  /*
   * ### Private Remarks
   *
   * While both Lit and Knyt use the same name for this operation, their
   * behaviors differ. In Knyt, updates are only triggered via the
   * `requestUpdate` method, which is fire-and-forget and does not return a
   * promise. Update progress is tracked using the `updateComplete` property,
   * a promise that resolves when the current update finishes.
   */
  performUpdate(): void | Promise<void>;
};

/**
 * A private symbol used to store the `updateComplete` promise
 */
const _updateComplete = Symbol("updateComplete");

/**
 * A class that adapts a `ReactiveControllerHost` to a view.
 *
 * @alpha This is an experimental API and will change in the future.
 */
// TODO: Rename to `BasicReactiveControllerHost`
export class ReactiveControllerHostAdapter implements ReactiveControllerHost {
  debug = false;

  debugLog(...args: any[]): void {
    if (this.debug) console.debug(...args);
  }

  /**
   * @see updateComplete
   *
   * @internal scope: package
   */
  /*
   * ### Private Remarks
   *
   * This property can't be natively private, because it needs to be
   * accessed by mixin classes. Declared private methods can be accessed by
   * mixin classes, but natively private properties can't.
   */
  private [_updateComplete]: PromiseWithResolvers<boolean> | undefined;

  /**
   * A promise of a boolean that indicates if the update resolved without triggering another update.
   * This behavior is for compatibility with Lit's `ReactiveControllerHost` interface.
   *
   * @see {@link ReactiveControllerHost['updateComplete']}
   * @see {@link https://lit.dev/docs/components/lifecycle/#updatecomplete}
   *
   * @public
   */
  get updateComplete(): Promise<boolean> {
    return this[_updateComplete]?.promise ?? Promise.resolve(true);
  }

  /** @internal scope: package */
  #hooks: ReactiveControllerHostAdapterHooks;

  /**
   * A set of reactive controllers that are added to the host.
   *
   * @remarks
   *
   * This must be a `Set` to ensure that the same controller
   * is not added multiple times, which could lead to
   * unexpected behavior when rendering.
   *
   * @internal scope: package
   */
  #reactiveControllers = new Set<ReactiveController>();

  constructor(hooks: ReactiveControllerHostAdapterHooks) {
    this.#hooks = hooks;

    this.#pauseForInitialization();
  }

  /**
   * Delays resolution of the `updateComplete` promise by one microtask,
   * allowing the host to finish initialization before notifying observers
   * that updates are complete.
   *
   * @remarks
   *
   * This method is called during host construction to ensure that any
   * observers subscribing to the `updateComplete` promise do not receive
   * a completion signal before the host is fully initialized.
   * By resolving the promise after a microtask, the host has time to
   * perform necessary setup and request additional updates if needed.
   *
   * This is particularly important for DOM elements, where attributes
   * cannot be set until after construction. The microtask delay ensures
   * that attributes can be set before observers are notified of update
   * completion, preventing premature notifications.
   */
  async #pauseForInitialization() {
    const updateComplete = Promise.withResolvers<boolean>();

    this[_updateComplete] = updateComplete;

    // Wait for the next microtask to ensure that the host is fully initialized
    await Promise.resolve();

    /**
     * No additional updates while the update was in progress.
     */
    const noPendingUpdates = this[_updateComplete] === updateComplete;

    updateComplete.resolve(noPendingUpdates);
  }

  async performPendingUpdate(): Promise<void> {
    this.debugLog("ReactiveControllerHostAdapter: performPendingUpdate called");

    // Create a new "fake" update cycle to temporarily block the
    // `updateComplete` promise.
    const pendingUpdate = Promise.withResolvers<boolean>();

    // Block the `updateComplete` promise while waiting for the current
    // update cycle to complete.
    this[_updateComplete] = pendingUpdate;

    // Wait for the next microtask to ensure that the pending update is
    // processed outside of the current update cycle.
    await Promise.resolve();

    // Resolve the pending update promise with `false` to indicate that
    // an additional update was pending while `updateComplete` was blocked.
    pendingUpdate.resolve(false);

    // Short circuit the `requestUpdate()` -> `await updateComplete` flow
    await this.#handleUpdateRequest();

    this.debugLog("ReactiveControllerHostAdapter: performPendingUpdate done");
  }

  /**
   * Adds a controller to the host.
   *
   * @remarks
   *
   * This method is idempotent.
   * The same controller instance can't be added multiple times.
   *
   * @public
   */
  addController(controller: ReactiveController): void {
    this.#reactiveControllers.add(controller);
  }

  /**
   * Removes a controller from the host.
   *
   * @remarks
   *
   * This method is idempotent.
   *
   * @public
   */
  removeController(controller: ReactiveController): void {
    this.#reactiveControllers.delete(controller);
  }

  /**
   * Called when the host is connected to the DOM.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
   *
   * @public
   */
  /*
   * ### Private Remarks
   *
   * Do not rename. The name is standardized by the Custom Elements API.
   */
  connectedCallback() {
    this.#notifyControllers("hostConnected");
  }

  /**
   * Called when the host will update.
   *
   * @remarks
   *
   * These are non-standard methods, but were added for
   * consistency with the `connectedCallback` and `disconnectedCallback`
   * methods.
   *
   * @public
   */
  updateCallback() {
    if (!isClientSide()) return;

    // The `hostUpdate` methods should only called on the client-side
    // for compatibility with Lit.
    this.#notifyControllers("hostUpdate");
  }

  /**
   * Called when the host has updated.
   *
   * @remarks
   *
   * These are non-standard methods, but were added for
   * consistency with the `connectedCallback` and `disconnectedCallback`
   * methods.
   *
   * @public
   */
  updatedCallback() {
    if (!isClientSide()) return;

    // The `hostUpdated` methods should only called on the client-side
    // for compatibility with Lit.
    this.#notifyControllers("hostUpdated");
  }

  /**
   * Called when the host is disconnected from the DOM.
   */
  /*
   * ### Private Remarks
   *
   * Do not rename. The name is standardized by the Custom Elements API.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
   *
   * @public
   */
  disconnectedCallback() {
    this.#notifyControllers("hostDisconnected");
  }

  /**
   * This method is called when the host is requested to update,
   * by an external source.
   *
   * @public
   */
  requestUpdate(): void {
    this.#handleUpdateRequest().catch((error) => {
      // This should never happen, because errors should be captured
      // within the `performUpdate` method, and exposed via the
      // `updateComplete` promise.
      //
      // However, if it does happen, we need to handle it gracefully,
      // and log the error to the console.
      console.error(error);
    });
  }

  /*
   * ### Private Remarks
   *
   * This method is called when the host is requested to update.
   *
   * This method kept separate from `requestUpdate` to simply allow for the
   * use of `async/await`, because `requestUpdate` isn't supposed to return
   * a promise. i.e. it's a fire-and-forget method.
   *
   * @internal scope: package
   */
  async #handleUpdateRequest(): Promise<void> {
    this.debugLog("ReactiveControllerHostAdapter: #handleUpdateRequest called");

    /**
     * A new promise is created each time `requestUpdate` is called.
     *
     * The promise is resolved when the update is complete,
     * and rejected if an error occurs during the update.
     *
     * @see {@link ReactiveControllerHost["updateComplete"]}
     * @see {@link https://lit.dev/docs/components/lifecycle/#updatecomplete}
     */
    const updateComplete = Promise.withResolvers<boolean>();

    this.debugLog(
      `ReactiveControllerHostAdapter: before setting updateComplete`,
    );

    this[_updateComplete] = updateComplete;

    this.debugLog(
      `ReactiveControllerHostAdapter: after setting updateComplete`,
    );

    // Performs an update of the view and notifies the controllers.
    try {
      // `performUpdate` should be called for every update request.
      // It's NOT the responsibility of this adapter to determine
      // how or when the update is performed, it just calls the
      // `performUpdate` method provided by the hooks.
      //
      // In the case of `KnytElement`, this logic is delegated to the
      // `Controllable` mixin, which implements the `stageModification`
      // method to handle the update logic.
      await this.#hooks.performUpdate();
    } catch (error) {
      updateComplete.reject(error);
      return;
    }

    /**
     * No additional updates while the update was in progress.
     */
    const noPendingUpdates = this[_updateComplete] === updateComplete;

    updateComplete.resolve(noPendingUpdates);

    this.debugLog(
      `ReactiveControllerHostAdapter: updateComplete resolved with ${noPendingUpdates}`,
    );
  }

  #notifyControllers(eventName: keyof ReactiveController): void {
    this.debugLog(
      `ReactiveControllerHostAdapter: notifying controllers of ${eventName}`,
    );

    // Copy the current set of controller to prevent issues
    // if the set is modified (e.g., controller unsubscribe)
    // during iteration.
    const reactiveControllers = Array.from(this.#reactiveControllers);

    for (const controller of reactiveControllers) {
      // Controller methods are optional.
      if (typeof controller[eventName] === "function") {
        // Don't detach the handler from the controller, as it may access `this`.
        controller[eventName]();
      }
    }

    this.debugLog(
      `ReactiveControllerHostAdapter: notified controllers of ${eventName}`,
    );
  }

  /**
   * @internal scope: test
   */
  /*
   * ### Private Remarks
   *
   * A method used for testing that exposes the internal state of the host.
   */
  // TODO: Remove this in production builds
  _getReactiveControllers(): ReactiveController[] {
    if (import.meta.env?.NODE_ENV === "test") {
      return [...this.#reactiveControllers];
    }

    throw new ReferenceError("`_getReactiveControllers` is not implemented.");
  }
}
