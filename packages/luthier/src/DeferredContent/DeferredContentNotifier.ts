import {
  computeRef,
  mapRef,
  ref,
  sequentialPairs,
  unwrapRef,
  type Observer,
  type Reference,
  type Subscription,
} from "@knyt/artisan";
import {
  track,
  untrack,
  type Context,
  type ReactiveController,
  type ReactiveControllerHost,
} from "@knyt/tasker";

import { DeferredContentContext } from "./DeferredContentContext";
import type { DeferredContentController } from "./DeferredContentController";
import { ImmutableRegistry } from "./ImmutableRegistry";

/**
 * A controller that manages deferred content rendering based on the state of associated promises.
 *
 * @remarks
 *
 * The controller tracks promises registered through and updates its loading state accordingly.
 * Through context, it can coordinate with parent controllers to propagate loading states,
 * and defers to parent controllers when available.
 *
 * @internal scope: package
 */
/*
 * ### Private Remarks
 *
 * This shouldn't be make public as it's only used internally by `DeferredContentRenderer`.
 * Instead, `defer` should be the public API that users interact with.
 */
export class DeferredContentNotifier
  implements ReactiveController, Observer<Promise<any> | undefined>
{
  #host: ReactiveControllerHost;
  #pendingPromises$ = ref(new ImmutableRegistry<Promise<unknown>>());
  #pendingIsLoading$ = mapRef(
    this.#pendingPromises$,
    (promises) => promises.hasAny,
  );
  #consumer: Context.ConsumerType<DeferredContentController | null>;
  /**
   * A subscription to the controller context changes.
   */
  #consumerSubscription: Subscription;

  /**
   * @internal scope: package
   */
  readonly isLoading$: Reference.Readonly<boolean>;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.#host = host;
    this.#consumer = DeferredContentContext.createConsumer(host);
    this.isLoading$ = computeRef(
      this.#pendingIsLoading$,
      unwrapRef(this.#consumer, (controller) => controller?.isLoading$),
      (pendingIsLoading, parentIsLoading) =>
        parentIsLoading ?? pendingIsLoading,
    );

    // Operations that need to be torn down in the `destroy()` method
    {
      track(this.#host, this.isLoading$);
      this.#consumerSubscription = this.#consumer.subscribe(
        this.#controllerObserver,
      );
      this.#host.addController(this);
    }
  }

  registerPromise<T extends Promise<any>>(promise: T): T {
    const controller = this.#consumer.value;

    this.#addPendingPromise(promise);

    if (controller) {
      controller.registerPromise(promise);
    }

    promise.finally(() => {
      this.#removePendingPromise(promise);
    });

    return promise;
  }

  unregisterPromise<T extends Promise<any>>(promise: T): T {
    const controller = this.#consumer.value;

    this.#removePendingPromise(promise);

    if (controller) {
      controller.unregisterPromise(promise);
    }

    return promise;
  }

  #unregisterAllPendingPromises(): void {
    const controller = this.#consumer.value;

    if (controller) {
      for (const promise of this.#pendingPromises$.value) {
        controller.unregisterPromise(promise);
      }
    }

    this.#pendingPromises$.set(new ImmutableRegistry());
  }

  #addPendingPromise(promise: Promise<any>): void {
    this.#pendingPromises$.set(this.#pendingPromises$.value.with(promise));
  }

  #removePendingPromise(promise: Promise<any>): void {
    this.#pendingPromises$.set(this.#pendingPromises$.value.without(promise));
  }

  /**
   * A next handler that accepts a promise or undefined.
   *
   * @remarks
   *
   * This handler allows the class to be used as an observer
   * that can react to changes in promise references.
   */
  next(data: Promise<any> | undefined): void {
    this.#promiseObserver.next(data);
  }

  /**
   * An observer that reacts to changes in promise references.
   */
  #promiseObserver = sequentialPairs<Promise<any> | undefined>(
    undefined,
    ([previousPromise, currentPromise]): void => {
      if (currentPromise) {
        this.registerPromise(currentPromise);
      }
      if (previousPromise) {
        this.unregisterPromise(previousPromise);
      }
    },
  );

  /**
   * An observer that reacts to changes in the controller context.
   */
  #controllerObserver = sequentialPairs<DeferredContentController | null>(
    null,
    ([previousController, currentController]) => {
      const pendingPromises = this.#pendingPromises$.value;

      if (previousController) {
        // Unregister all pending promises from the previous controller.
        for (const promise of pendingPromises) {
          previousController.unregisterPromise(promise);
        }
      }
      if (currentController) {
        // Register all pending promises with the new controller.
        for (const promise of pendingPromises) {
          currentController.registerPromise(promise);
        }
      }
    },
  );

  hostConnected?: () => void;

  /**
   * Cleans up resources used by the controller and removes it from the host.
   */
  destroy(): void {
    this.#host.removeController(this);
    this.#consumerSubscription.unsubscribe();
    untrack(this.#host, this.isLoading$);
    this.#unregisterAllPendingPromises();
  }
}
