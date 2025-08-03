import {
  isNonNullableObject,
  type BoundMap,
  type Subscription,
} from "@knyt/artisan";

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
   * A method called by the host before the element is updated.
   *
   * @remarks
   *
   * This method is called before an update occurs, whether the host
   * is connected to the DOM or not.
   */
  hostBeforeUpdate?: LifecycleDelegate.BeforeUpdateHook<P>;
  /**
   * A method called by the host when an error occurs during
   * a lifecycle event, such as during the `hostBeforeUpdate` method.
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
   * A method called by the host when the host is updated.
   *
   * @remarks
   *
   * This is the equivalent of the `hostUpdated` in a reactive controller,
   * and is called after the host is updated.
   */
  hostUpdated?: LifecycleDelegate.UpdatedHook;
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
   * A payload that is passed to the `hostBeforeUpdate` lifecycle method.
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
     */
    abortController: AbortController;
    /**
     * The properties that have changed since the last update.
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
  export type BeforeUpdateHook<P> = {
    (payload: BeforeUpdatePayload<P>): void | Promise<void>;
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
   * A lifecycle hook that is called by the host when the host is updated.
   *
   * @remarks
   *
   * This is the equivalent of the `hostUpdated` in a reactive controller,
   */
  /*
   * ### Private Remarks
   *
   * While this method is named `hostUpdated`, like the method in `ReactiveController`,
   * it is not required to have the same implementation. However, both can be used
   * interchangeably. So, to ensure consistency and prevent confusion or interface
   * incompatibilities, we enforce that both methods use the same name and type signature.
   *
   * This is very much an intentional design choice to ensure that
   * `LifecycleDelegate` can be used as a replacement for `ReactiveController` when writing
   * logic specific to a Knyt component. I didn't want to always have to implement both interfaces
   * in the same class, so I made sure that the `hostUpdated` method in `LifecycleDelegate`
   * has the same type signature as the `hostUpdated` method in `ReactiveController`.
   */
  export type UpdatedHook = NonNullable<ReactiveController["hostUpdated"]>;

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
    export type WithoutPayload =
      | "hostMounted"
      | "hostUpdated"
      | "hostUnmounted";
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
   * they were added. To remove previously registered hooks, use {@link removeLifecycleDelegate}.
   *
   * @param input - The lifecycle delegate object containing one or more lifecycle hook methods.
   * @see {@link LifecycleDelegate}
   */
  addLifecycleDelegate(input: LifecycleDelegate<P>): void;

  /**
   * Removes a previously registered lifecycle delegate from the host instance.
   *
   * @remarks
   * This method detaches the specified {@link LifecycleDelegate} object, preventing its lifecycle
   * hook methods from being invoked during the host's lifecycle events. If the delegate was not
   * previously registered, this method has no effect.
   *
   * @param input - The lifecycle delegate object to remove.
   * @see {@link addLifecycleDelegate}
   */
  removeLifecycleDelegate(input: LifecycleDelegate<P>): void;
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
    "addLifecycleDelegate" in value &&
    typeof (value as LifecycleDelegateHost).addLifecycleDelegate ===
      "function" &&
    "removeLifecycleDelegate" in value &&
    typeof (value as LifecycleDelegateHost).removeLifecycleDelegate ===
      "function"
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

  addLifecycleDelegate(hooks: LifecycleDelegate<P>): void {
    this.#hookRegistry.add(hooks);
  }

  removeLifecycleDelegate(hooks: LifecycleDelegate<P>): void {
    this.#hookRegistry.delete(hooks);
  }

  addLifecycleHook<K extends keyof LifecycleDelegate<P>>(
    hookName: K,
    hook: LifecycleDelegate<P>[K],
  ): Subscription {
    const hooks: LifecycleDelegate<P> = {
      [hookName]: hook,
    };

    this.addLifecycleDelegate(hooks);

    return {
      unsubscribe: () => {
        this.removeLifecycleDelegate(hooks);
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
  async invokeHooks(
    callback: (hooks: LifecycleDelegate<P>) => void | Promise<void>,
  ): Promise<void> {
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
    // to the caller of `performBeforeUpdate`.
    throw error;
  }

  async #invokeBeforeUpdate(
    payload: LifecycleDelegate.BeforeUpdatePayload<P>,
  ): Promise<void> {
    try {
      await this.invokeHooks((hooks) => hooks.hostBeforeUpdate?.(payload));
    } catch (error) {
      this.#handleInvokeError(error, payload.abortController);
    }
  }

  async #invokeBeforeMount(
    payload: LifecycleDelegate.BeforeMountPayload,
  ): Promise<void> {
    try {
      await this.invokeHooks((hooks) => hooks.hostBeforeMount?.(payload));
    } catch (error) {
      this.#handleInvokeError(error, payload.abortController);
    }
  }

  async #invokeHookWithoutPayload(
    hookName: LifecycleDelegate.HookName.WithoutPayload,
  ): Promise<void> {
    try {
      await this.invokeHooks((hooks) => hooks[hookName]?.());
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
   * Performs the `hostBeforeUpdate` lifecycle method for all hooks.
   *
   * @remarks
   *
   * This method is called by the host before the element is updated.
   * It calls the `hostBeforeUpdate` method of all hooks in parallel,
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
  performBeforeUpdate(
    payload: LifecycleDelegate.BeforeUpdatePayload<P>,
  ): void | Promise<void> {
    if (this.#shouldInvokeHooks("hostBeforeUpdate")) {
      return this.#invokeBeforeUpdate(payload);
    }
  }

  performMounted(): void {
    // This is intentionally not awaited: post-event hooks are not async/cancelable.
    // If async, they run in parallel.
    this.#invokeHookWithoutPayload("hostMounted");
  }

  performUpdated(): void {
    // This is intentionally not awaited: post-event hooks are not async/cancelable.
    // If async, they run in parallel.
    this.#invokeHookWithoutPayload("hostUpdated");
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
   * Registers a lifecycle hook to be called before the host is updated.
   *
   * @param hostBeforeUpdate - The callback to invoke before updating.
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
   * @param hostUpdated - The callback to invoke after the host update is complete.
   * @returns A subscription object that can be used to remove the hook.
   */
  onUpdated(hostUpdated: LifecycleDelegate.UpdatedHook): Subscription {
    return this.addLifecycleHook("hostUpdated", hostUpdated);
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
