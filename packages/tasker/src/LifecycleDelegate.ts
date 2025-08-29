import {
  isNonNullableObject,
  type BoundMap,
  type Subscription,
} from "@knyt/artisan";

import type { LifecycleInterrupt } from "./LifecycleInterrupt";
import type { ReactiveController } from "./ReactiveController";

/**
 * An object that taps into the lifecycle of a host
 *
 * @remarks
 *
 * This is used to add lifecycle hooks to the host element.
 * Lifecycle hooks are methods that are called by the host
 * at specific points in the element's lifecycle, such as
 * before the element is updated.
 *
 * @beta
 */
export type LifecycleDelegate<P> = {
  /**
   * A method called by the host when the element is connected to the DOM,
   * before the element is rendered.
   *
   * @remarks
   *
   * This is not called during server-side rendering with Knyt Glazier,
   * as the host is not connected to the DOM in that case.
   *
   * If a custom server-side rendering implementation is used,
   * this method may be called if the host is connected to the DOM.
   */
  hostBeforeMount?: LifecycleDelegate.BeforeMountHook;
  /**
   * Called by the host before rendering a new declaration during an update.
   *
   * @remarks
   *
   * This hook runs after an update has started and just before a new declaration
   * is rendered, regardless of the host's connection to the DOM.
   *
   * Use this to perform setup or to abort the render if needed. If aborted,
   * the update cycle completes without rendering a new declaration or changing the DOM.
   *
   * This hook is invoked during both server-side and client-side rendering.
   *
   * It may be called multiple times before an actual update, such as when several
   * properties change quickly. Unlike the update itself, this hook is triggered
   * on every update request and is not debounced or throttled. As such, it should
   * be used for lightweight operations only.
   */
  hostUpdateRequested?: LifecycleDelegate.UpdateRequestedHook<P>;
  /**
   * Called by the host when the element's lifecycle is interrupted.
   *
   * @remarks
   *
   * A lifecycle interruption occurs when the normal flow is halted by
   * an external factor. An interruption is not an error, and is distinct
   * from aborting an update or mount via an `AbortController`.
   *
   * Use this hook to perform cleanup or state changes in response to
   * an interruption.
   *
   * Errors thrown here are forwarded to `hostErrorCaptured` handlers.
   */
  hostInterrupted?: LifecycleDelegate.InterruptedHook<unknown>;
  /**
   * A method called by the host when an error occurs during
   * a lifecycle event, such as during the `hostUpdateRequested` method.
   */
  hostErrorCaptured?: LifecycleDelegate.ErrorCapturedHook;
  /**
   * A method called by the host when the host is mounted.
   *
   * @remarks
   *
   * This is the equivalent of the `connectedCallback` in a custom element,
   * and is called when the host is connected to the DOM.
   */
  hostMounted?: LifecycleDelegate.MountedHook;
  /**
   * A method called by the host when an update is performed on the host.
   *
   * @remarks
   *
   * This is the equivalent of the `hostUpdate` in a reactive controller,
   * and is called when an update is performed on the host.
   */
  hostBeforeUpdate?: LifecycleDelegate.BeforeUpdateHook<P>;
  /**
   * A method called by the host when the host is updated.
   *
   * @remarks
   *
   * This is the equivalent of the `hostUpdated` in a reactive controller,
   * and is called after the host is updated.
   */
  hostAfterUpdate?: LifecycleDelegate.AfterUpdateHook<P>;
  /**
   * A method called by the host when the host is unmounted.
   *
   * @remarks
   *
   * This is the equivalent of the `disconnectedCallback` in a custom element,
   * and is called when the host is disconnected from the DOM.
   */
  hostUnmounted?: LifecycleDelegate.UnmountedHook;
};

export namespace LifecycleDelegate {
  export type BeforeMountPayload = {
    /**
     * An `AbortController` that can be used to abort the mount operation.
     *
     * @remarks
     *
     * This is useful for preventing a component from replacing server-rendered
     * content with client-rendered content when the component is first connected
     * to the DOM.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortController | MDN: AbortController}
     */
    abortController: AbortController;
  };

  /**
   * A lifecycle hook that is called by the host
   * when the host is connected to the DOM.
   *
   * @remarks
   *
   * This is not called during server-side rendering,
   * as the host is not connected to the DOM in that case.
   *
   * The hook may return a promise to indicate that the update should be delayed
   * until the promise is resolved.
   */
  export type BeforeMountHook = {
    (payload: BeforeMountPayload): void | Promise<void>;
  };

  /**
   * A payload that is passed to the `hostUpdateRequested` lifecycle method.
   *
   * @beta This os an experimental API and may change in the future.
   */
  export type BeforeUpdatePayload<P> = {
    /**
     * An `AbortController` that can be used to abort the update operation.
     *
     * @remarks
     *
     * This is useful for preventing a component from updating for any reason.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortController | MDN: AbortController}
     */
    abortController: AbortController;
    /**
     * The properties that have changed since the last update.
     */
    changedProperties: BoundMap.Readonly<P>;
  };

  /**
   * A lifecycle hook that is called by the host before an update
   * is performed on the host.
   *
   * @remarks
   *
   * The hook may return a promise to indicate that the update
   * should be delayed until the promise is resolved.
   */
  /*
   * ### Private Remarks
   *
   * The method is named `hostBeforeUpdate` to avoid clashing with the `hostUpdate` method
   * in `ReactiveController`. They have different type signatures, and this naming allows
   * both interfaces to be implemented in the same class.
   *
   * The primary use case for this method is to perform lightweight
   * operations or to abort the update if needed. If aborted,
   * the update cycle completes without rendering a new declaration
   * or changing the DOM.
   */
  export type BeforeUpdateHook<P> = {
    (payload: BeforeUpdatePayload<P>): void | Promise<void>;
  };

  /**
   * A payload that is passed to the `hostUpdateRequested` lifecycle method.
   *
   * @beta This os an experimental API and may change in the future.
   */
  export type UpdateRequestedPayload<P> = {
    /**
     * An `AbortController` that can be used to abort the update operation.
     *
     * @remarks
     *
     * This is useful for preventing a component from updating for any reason.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortController | MDN: AbortController}
     */
    abortController: AbortController;
    /**
     * The properties that have changed since the last update request.
     */
    changedProperties: BoundMap.Readonly<P>;
  };

  /**
   * A lifecycle hook that is called by the host
   * before the host is updated.
   *
   * @remarks
   *
   * The hook may return a promise to indicate that the update should be delayed
   * until the promise is resolved.
   */
  export type UpdateRequestedHook<P> = {
    (payload: UpdateRequestedPayload<P>): void | Promise<void>;
  };

  /**
   * A lifecycle hook that is called by the host
   * when the host's lifecycle is interrupted.
   *
   * @remarks
   *
   * The hook may return a promise to indicate that the interruption
   * handling should be completed before proceeding.
   */
  export type InterruptedHook<TReason> = {
    (interrupt: LifecycleInterrupt<TReason>): void | Promise<void>;
  };

  /**
   * A synchronous error handler that is called by the host
   * when an error occurs during a lifecycle event.
   */
  export type ErrorCapturedHook = {
    (error: unknown): void;
  };

  /**
   * A lifecycle hook that is called by the host when the host is mounted.
   *
   * @remarks
   *
   * This is the equivalent of the `hostConnected` in a custom element,
   */
  export type MountedHook = {
    (): void;
  };

  /**
   * A payload that is passed to the `hostAfterUpdate` lifecycle method.
   */
  export type AfterUpdatePayload<P> = {
    /**
     * The properties that have changed during the last update.
     */
    changedProperties: BoundMap.Readonly<P>;
  };

  /**
   * A lifecycle hook that is called by the host when the host is updated.
   *
   * @remarks
   *
   * This is invoked before the `hostUpdated` hook in a reactive controllers.
   */
  /*
   * ### Private Remarks
   *
   * The method is named `hostAfterUpdate` to avoid clashing with the `hostUpdated` method
   * in `ReactiveController`. They have different type signatures, and this naming allows
   * both interfaces to be implemented in the same class.
   *
   * In practice, both methods can generally be used interchangeably.
   */
  export type AfterUpdateHook<P> = {
    (payload: AfterUpdatePayload<P>): void | Promise<void>;
  };

  /**
   * A lifecycle hook that is called by the host when the host is unmounted.
   *
   * @remarks
   *
   * This is the equivalent of the `hostDisconnected` in a custom element,
   */
  export type UnmountedHook = {
    (): void;
  };

  export type HookName = keyof LifecycleDelegate<any>;

  export namespace HookName {
    export type WithoutPayload = "hostMounted" | "hostUnmounted";
  }
}

export type LifecycleDelegateHost<P = any> = {
  /**
   * Registers one or more lifecycle hooks to the host instance.
   *
   * @remarks
   * This method allows you to attach a {@link LifecycleDelegate} object, which may implement
   * any combination of lifecycle hook methods. The hooks will be invoked at the appropriate
   * points in the host's lifecycle, such as before mounting, before updating, after mounting,
   * after updating, on unmount, or when an error is captured.
   *
   * Multiple delegates can be registered; all registered hooks will be called in the order
   * they were added. To remove previously registered hooks, use {@link removeDelegate}.
   *
   * @param input - The lifecycle delegate object containing one or more lifecycle hook methods.
   * @see {@link LifecycleDelegate}
   */
  addDelegate(input: LifecycleDelegate<P>): void;

  /**
   * Removes a previously registered lifecycle delegate from the host instance.
   *
   * @remarks
   * This method detaches the specified {@link LifecycleDelegate} object, preventing its lifecycle
   * hook methods from being invoked during the host's lifecycle events. If the delegate was not
   * previously registered, this method has no effect.
   *
   * @param input - The lifecycle delegate object to remove.
   * @see {@link addDelegate}
   */
  removeDelegate(input: LifecycleDelegate<P>): void;
};

/**
 * Determines whether the input is a {@link LifecycleDelegateHost}.
 *
 * @public
 */
export function isLifecycleDelegateHost(
  value: unknown,
): value is LifecycleDelegateHost {
  return (
    isNonNullableObject(value) &&
    "addDelegate" in value &&
    typeof (value as LifecycleDelegateHost).addDelegate === "function" &&
    "removeDelegate" in value &&
    typeof (value as LifecycleDelegateHost).removeDelegate === "function"
  );
}

/**
 * A basic implementation of the {@link LifecycleDelegateHost} interface.
 *
 * @internal scope: package
 */
export class BasicLifecycleDelegateHost<P> implements LifecycleDelegateHost<P> {
  /**
   * A set of resource renderers that are added to the host.
   *
   * @remarks
   *
   * This must be a `Set` to ensure that the same renderer
   * is not added multiple times, which could lead to
   * unexpected behavior when rendering.
   */
  #hookRegistry = new Set<LifecycleDelegate<P>>();

  addDelegate(hooks: LifecycleDelegate<P>): void {
    this.#hookRegistry.add(hooks);
  }

  removeDelegate(hooks: LifecycleDelegate<P>): void {
    this.#hookRegistry.delete(hooks);
  }

  addLifecycleHook<K extends keyof LifecycleDelegate<P>>(
    hookName: K,
    hook: LifecycleDelegate<P>[K],
  ): Subscription {
    const hooks: LifecycleDelegate<P> = {
      [hookName]: hook,
    };

    this.addDelegate(hooks);

    return {
      unsubscribe: () => {
        this.removeDelegate(hooks);
      },
    };
  }

  /**
   * Checks whether the specified lifecycle hook
   * should be invoked based on the registered hooks.
   *
   * @remarks
   *
   * If there are no hooks, we can return immediately.
   * Don't return a promise if we can avoid it,
   * as it can lead to unnecessary microtask scheduling.
   */
  #shouldInvokeHooks(name: keyof LifecycleDelegate<P>): boolean {
    if (this.#hookRegistry.size === 0) {
      // If there are no hooks, we can return false immediately.
      return false;
    }

    // Check if any of the hooks have the specified method
    // to determine whether we should invoke the hooks.
    return Array.from(this.#hookRegistry).some((hooks) => !!hooks[name]);
  }

  /**
   * Invokes the provided callback for each registered lifecycle hooks.
   */
  async #invokeHooks(
    callback: (hooks: LifecycleDelegate<P>) => void | Promise<void>,
  ): Promise<void> {
    // All side effects should be asynchronous.
    // Wait until the next microtask to ensure that
    // all side effects are async.
    await Promise.resolve();

    // All hooks are called in parallel, so we can use
    // add them to an array and then use `Promise.all`
    // to wait for all of them to complete.
    //
    // NOTE: The use of `Array.from` serves two purposes:
    // 1. It creates a shallow copy of the set, so that
    //    we can iterate over it without worrying about
    //    the set being modified while we iterate.
    // 2. It converts the set to an array, so that we can
    //    use `map` to create an array of promises
    //    that we can wait for.
    await Promise.all(
      Array.from(this.#hookRegistry).map((hooks) => callback(hooks)),
    );
  }

  #handleInvokeError(error: unknown, abortController?: AbortController): void {
    // If an error occurs anywhere in the lifecycle hooks,
    // we want to abort the operation using the provided
    // AbortController, if it hasn't already been aborted.
    if (abortController?.signal.aborted === false) {
      abortController.abort(error);
    }

    // Re-throw the error here, as we want to propagate it
    // to the caller of `performUpdateRequested`.
    throw error;
  }

  async #invokeUpdateRequested(
    payload: LifecycleDelegate.UpdateRequestedPayload<P>,
  ): Promise<void> {
    try {
      await this.#invokeHooks((hooks) => hooks.hostUpdateRequested?.(payload));
    } catch (error) {
      this.#handleInvokeError(error, payload.abortController);
    }
  }

  async #invokeInterrupted<TReason>(
    interrupt: LifecycleInterrupt<TReason>,
  ): Promise<void> {
    try {
      await this.#invokeHooks((hooks) => hooks.hostInterrupted?.(interrupt));
    } catch (error) {
      this.#handleInvokeError(error);
    }
  }

  async #invokeBeforeMount(
    payload: LifecycleDelegate.BeforeMountPayload,
  ): Promise<void> {
    try {
      await this.#invokeHooks((hooks) => hooks.hostBeforeMount?.(payload));
    } catch (error) {
      this.#handleInvokeError(error, payload.abortController);
    }
  }

  async #invokeBeforeUpdate(
    payload: LifecycleDelegate.BeforeUpdatePayload<P>,
  ): Promise<void> {
    try {
      await this.#invokeHooks((hooks) => hooks.hostBeforeUpdate?.(payload));
    } catch (error) {
      this.#handleInvokeError(error, payload.abortController);
    }
  }

  async #invokeAfterUpdate(
    payload: LifecycleDelegate.AfterUpdatePayload<P>,
  ): Promise<void> {
    try {
      await this.#invokeHooks((hooks) => hooks.hostAfterUpdate?.(payload));
    } catch (error) {
      this.#handleInvokeError(error);
    }
  }

  async #invokeHookWithoutPayload(
    hookName: LifecycleDelegate.HookName.WithoutPayload,
  ): Promise<void> {
    try {
      await this.#invokeHooks((hooks) => hooks[hookName]?.());
    } catch (error) {
      this.#handleInvokeError(error);
    }
  }

  /**
   * Performs the `hostBeforeMount` lifecycle method for all hooks.
   *
   * @remarks
   *
   * This method is called by the host when the element is connected to the DOM,
   * before the element is rendered.
   * It calls the `hostBeforeMount` method of all hooks in parallel,
   * and waits for all of them to complete before returning.
   *
   * If any hook throws an error, the operation is aborted and the error
   * is re-thrown to propagate to the caller.
   */
  /*
   * ### Private Remarks
   *
   * tldr; a bit of micro-optimization doesn't hurt.
   *
   * This method is intentionally not marked as `async`,
   * because it may only perform synchronous operations
   * and we want to avoid the overhead of creating a
   * microtask for the promise resolution;
   */
  performBeforeMount(
    payload: LifecycleDelegate.BeforeMountPayload,
  ): void | Promise<void> {
    if (this.#shouldInvokeHooks("hostBeforeMount")) {
      return this.#invokeBeforeMount(payload);
    }
  }

  /**
   * Performs the `hostUpdateRequested` lifecycle method for all hooks.
   *
   * @remarks
   *
   * This method is called by the host before the element is updated.
   * It calls the `hostUpdateRequested` method of all hooks in parallel,
   * and waits for all of them to complete before returning.
   *
   * If any hook throws an error, the operation is aborted and the error
   * is re-thrown to propagate to the caller.
   */
  /*
   * ### Private Remarks
   *
   * tldr; a bit of micro-optimization doesn't hurt.
   *
   * This method is intentionally not marked as `async`,
   * because it may only perform synchronous operations
   * and we want to avoid the overhead of creating a
   * microtask for the promise resolution;
   */
  performUpdateRequested(
    payload: LifecycleDelegate.UpdateRequestedPayload<P>,
  ): void | Promise<void> {
    if (this.#shouldInvokeHooks("hostUpdateRequested")) {
      return this.#invokeUpdateRequested(payload);
    }
  }

  /**
   * Performs the `hostInterrupted` lifecycle method for all hooks.
   *
   * @remarks
   *
   * This method is called by the host when the element's lifecycle is
   * interrupted. It calls the `hostInterrupted` method of all hooks in
   * parallel, and waits for all of them to complete before returning.
   *
   * If any hook throws an error, the error is re-thrown to propagate
   * to the caller.
   */
  /*
   * ### Private Remarks
   *
   * tldr; a bit of micro-optimization doesn't hurt.
   *
   * This method is intentionally not marked as `async`,
   * because it may only perform synchronous operations
   * and we want to avoid the overhead of creating a
   * microtask for the promise resolution;
   */
  performInterrupted<TReason>(
    interrupt: LifecycleInterrupt<TReason>,
  ): void | Promise<void> {
    if (this.#shouldInvokeHooks("hostInterrupted")) {
      return this.#invokeInterrupted(interrupt);
    }
  }

  performMounted(): void {
    // This is intentionally not awaited: post-event hooks are not async/cancelable.
    // If async, they run in parallel.
    this.#invokeHookWithoutPayload("hostMounted");
  }

  performBeforeUpdate(payload: LifecycleDelegate.BeforeUpdatePayload<P>): void {
    // This is intentionally not awaited: post-event hooks are not async/cancelable.
    // If async, they run in parallel.
    this.#invokeBeforeUpdate(payload);
  }

  performAfterUpdate(payload: LifecycleDelegate.AfterUpdatePayload<P>): void {
    // These are intentionally not awaited: post-event hooks are not async/cancelable.
    // If async, they run in parallel.
    this.#invokeAfterUpdate(payload);
  }

  performUnmounted(): void {
    // This is intentionally not awaited: post-event hooks are not async/cancelable.
    // If async, they run in parallel.
    this.#invokeHookWithoutPayload("hostUnmounted");
  }

  /**
   * Synchronously handles an error that occurs during a lifecycle event.
   * Each error handler registered via `onError` will be called in turn
   * with the error that occurred.
   *
   * @returns `true` if the error was handled by at least one error handler
   *          `false` if the error was not handled by any error handler.
   */
  handleError(error: unknown): boolean {
    // If there are no hooks, we can return immediately.
    if (this.#hookRegistry.size === 0) return false;

    // Create a shallow array copy of the hooks set
    // to safely iterate and call each hook's `hostErrorCaptured` method,
    // even if the set is modified during iteration.
    const hooksInstancesWithErrorHandler = Array.from(
      this.#hookRegistry,
    ).filter((hooks) => hooks.hostErrorCaptured);

    if (hooksInstancesWithErrorHandler.length === 0) {
      // If no hooks have an error handler, we can return false.
      return false;
    }

    try {
      for (const hooks of hooksInstancesWithErrorHandler) {
        hooks.hostErrorCaptured?.(error);
      }
    } catch (error) {
      console.error(
        "An error occurred while handling the error in lifecycle hooks:",
        error,
      );
    }

    return true;
  }
}

/**
 * @internal scope: workspace
 */
export class LifecycleAdapter<P> extends BasicLifecycleDelegateHost<P> {
  /**
   * Registers a lifecycle hook to be called before the host is mounted.
   *
   * @param hostBeforeMount - The callback to invoke before mounting.
   * @returns A subscription object that can be used to remove the hook.
   */
  onBeforeMount(
    hostBeforeMount: LifecycleDelegate.BeforeMountHook,
  ): Subscription {
    return this.addLifecycleHook("hostBeforeMount", hostBeforeMount);
  }

  /**
   * Registers a lifecycle hook to be called after the host is mounted to the DOM.
   *
   * @param hostMounted - The callback to invoke when the host is mounted.
   * @returns A subscription object that can be used to remove the hook.
   */
  onMounted(hostMounted: LifecycleDelegate.MountedHook): Subscription {
    return this.addLifecycleHook("hostMounted", hostMounted);
  }

  /**
   * Registers a lifecycle hook to be called when an update is requested on the host.
   *
   * @param hostUpdateRequested - The callback to invoke before updating.
   * @returns A subscription object that can be used to remove the hook.
   */
  onUpdateRequested(
    hostUpdateRequested: LifecycleDelegate.UpdateRequestedHook<P>,
  ): Subscription {
    return this.addLifecycleHook("hostUpdateRequested", hostUpdateRequested);
  }

  /**
   * Registers a lifecycle hook to be called before an update is performed on the host.
   *
   * @param hostBeforeUpdate - The callback to invoke when an update is performed.
   * @returns A subscription object that can be used to remove the hook.
   */
  onBeforeUpdate(
    hostBeforeUpdate: LifecycleDelegate.BeforeUpdateHook<P>,
  ): Subscription {
    return this.addLifecycleHook("hostBeforeUpdate", hostBeforeUpdate);
  }

  /**
   * Registers a lifecycle hook to be called after the host has been updated.
   *
   * @param hostAfterUpdate - The callback to invoke after the host update is complete.
   * @returns A subscription object that can be used to remove the hook.
   */
  onAfterUpdate(
    hostAfterUpdate: LifecycleDelegate.AfterUpdateHook<P>,
  ): Subscription {
    return this.addLifecycleHook("hostAfterUpdate", hostAfterUpdate);
  }

  /**
   * Registers a lifecycle hook to be called when the host's lifecycle is interrupted.
   *
   * @param hostInterrupted - The callback to invoke when the host's lifecycle is interrupted.
   * @returns A subscription object that can be used to remove the hook.
   */
  onInterrupted(
    hostInterrupted: LifecycleDelegate.InterruptedHook<unknown>,
  ): Subscription {
    return this.addLifecycleHook("hostInterrupted", hostInterrupted);
  }

  /**
   * Registers a lifecycle hook to be called when the host is unmounted from the DOM.
   *
   * @param hostUnmounted - The callback to invoke when the host is unmounted.
   * @returns A subscription object that can be used to remove the hook.
   */
  onUnmounted(hostUnmounted: LifecycleDelegate.UnmountedHook): Subscription {
    return this.addLifecycleHook("hostUnmounted", hostUnmounted);
  }

  /**
   * Registers a lifecycle hook to be called when an error is captured during any lifecycle event.
   *
   * @param hostErrorCaptured - The error handler callback to invoke when an error occurs in a lifecycle hook.
   * @returns A subscription object that can be used to remove the error handler.
   */
  onErrorCaptured(
    hostErrorCaptured: LifecycleDelegate.ErrorCapturedHook,
  ): Subscription {
    return this.addLifecycleHook("hostErrorCaptured", hostErrorCaptured);
  }
}
