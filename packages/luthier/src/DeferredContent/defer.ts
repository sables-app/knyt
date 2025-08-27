import {
  debounce,
  isPromiseLike,
  ref,
  SubscriptionRegistry,
  type Observer,
  type Reference,
  type Subscription,
} from "@knyt/artisan";
import {
  hold,
  untrack,
  type ReactiveController,
  type ReactiveControllerHost,
} from "@knyt/tasker";
import type { KnytContent } from "@knyt/weaver";

import { DeferredContentNotifier } from "./DeferredContentNotifier";
import type { PromiseReference } from "./PromiseReference";

/**
 * A reference type that holds either the unwrapped values of multiple promises
 * or a unique symbol indicating the absence of data.
 */
type RenderDataReference<T extends readonly unknown[]> = Reference<
  undefined | PromiseReference.Collection.Unwrapped<T>
>;

/**
 * @internal scope: module
 */
type DeferredContentHost = ReactiveControllerHost & HTMLElement;

/**
 * @internal scope: module
 */
// NOTE: This only exported for typing purposes.
export class DeferredContentRenderer<T extends PromiseReference.Collection<any>>
  implements ReactiveController
{
  readonly #host: DeferredContentHost;
  readonly #data$: RenderDataReference<T>;
  readonly #references: T;
  readonly #notifier: DeferredContentNotifier;

  #isConnected = false;
  #activePromises = new Set<Promise<any>>();
  #subscriptions?: SubscriptionRegistry;

  constructor(host: DeferredContentHost, references: T) {
    this.#host = host;

    this.#references = references;

    // Operation that need to be torn down in the `destroy()` method
    {
      this.#notifier = new DeferredContentNotifier(host);
      this.#data$ = hold<undefined | PromiseReference.Collection.Unwrapped<T>>(
        host,
        undefined,
      );
      host.addController(this);
    }
  }

  async #updateData(): Promise<void> {
    const currentPromises = this.#references.map(
      // Do not remove undefined promises here,
      // as maintaining the order of references is important.
      // Instead, replace undefined promises with a resolved promise.
      (r) => r.value ?? Promise.resolve(undefined),
    );

    for (const promise of currentPromises) {
      this.#activePromises.add(promise);
      this.#notifier.registerPromise(promise);
    }

    try {
      const values = await Promise.all(currentPromises);

      for (const promise of currentPromises) {
        this.#activePromises.delete(promise);
      }

      this.#data$.set(values as PromiseReference.Collection.Unwrapped<T>);
    } catch (error) {
      // Unable to recover from a rejected promise.
      //
      // The error is logged and the data is not updated. This approach
      // encourages consistent error handling outside of deferred content.
      //
      // Handling errors within deferred content can reduce encapsulation
      // and complicate application logic. For clarity and maintainability,
      // please manage side effects and error handling separately from
      // content rendering.
      //
      // TODO: Use a shorter message in production builds.
      // TODO: Add a link to documentation about handling rejected promises.
      console.error(
        [
          "Knyt: An error occurred while resolving deferred content ",
          "promises. Please note that Knyt does not handle rejected ",
          "promises within deferred content. To ensure proper behavior, ",
          "please handle promise rejections outside of deferred content.",
        ].join("\n"),
        error,
      );
    }
  }

  /**
   * An observer that reacts to changes in any of the promise references.
   *
   * @detachable
   */
  readonly #promiseObserver: Observer<Promise<T> | undefined> = {
    next: debounce((currentPromise) => {
      // If the reference changes, re-fetch the data.
      // `updateData` will ensure that only the latest
      // promises are tracked.
      if (this.#isConnected) {
        this.#updateData();
      }
    }, debounce.Wait.Microtask),
  };

  /**
   * @internal scope: module
   */
  hostConnected(): void {
    this.#isConnected = true;

    // Subscribe to reference changes. Subscribing to each reference
    // will immediately trigger an update, so there is no need
    // to call `updateData` separately.
    this.#subscriptions = new SubscriptionRegistry(
      this.#references.map(
        (reference): Subscription => reference.subscribe(this.#promiseObserver),
      ),
    );
  }

  /**
   * @internal scope: module
   */
  hostDisconnected(): void {
    this.#isConnected = false;

    // Clear the active promises, as they are no longer relevant.
    this.#activePromises.clear();

    this.#subscriptions?.unsubscribeAll();

    for (const promise of this.#activePromises) {
      this.#notifier.unregisterPromise(promise);
    }
  }

  /**
   * Creates a render function that defers rendering while any of the
   * promises of the previously given references are unresolved.
   *
   * @remarks
   *
   * Whenever any of the references change, the rendering will be deferred again
   * until all new promises have resolved.
   *
   * While the rendering is deferred, a `DeferredContent` component higher in the
   * DOM tree may display a placeholder UI while loading is in progress.
   *
   * When all promises have resolved, the provided render function is called
   * with the resolved values, and its result is rendered. However, if any other
   * elements are being deferred under the `DeferredContent` element, the
   * placeholder will continue to be shown until all deferred content is ready.
   */
  thenRender(
    renderFn: (
      ...data: PromiseReference.Collection.Unwrapped<T>
    ) => KnytContent | Promise<KnytContent>,
  ): () => KnytContent | Promise<KnytContent> {
    return () => {
      const data = this.#data$.value;

      // Do not check whether isLoading from notifier, because
      // it may still be loading promises from other elements.
      // This render should only concern itself with its own data.
      if (data === undefined) {
        return null;
      }

      return renderFn(...data);
    };
  }

  /**
   * Cleans up resources used by the controller and removes it from the host.
   */
  destroy(): void {
    this.#host.removeController(this);
    untrack(this.#host, this.#data$);
    this.hostDisconnected();
    this.#notifier.destroy();
  }
}

/**
 * Defers rendering of content until the provided promise has resolved.
 *
 * @remarks
 *
 * After the promise resolves, the underlying controller is destroyed,
 * removing itself from the host, and any associated resources are cleaned up.
 */
function deferContentPromise<T>(
  host: DeferredContentHost,
  promise: Promise<T>,
): void {
  const renderer = new DeferredContentRenderer(host, [
    ref(promise).asReadonly(),
  ]);

  promise.finally(() => {
    renderer.destroy();
  });
}

/**
 * Signals a parent `DeferredContent` element to delay revealing its
 * content until the provided promise settles.
 */
export function defer<T>(host: DeferredContentHost, promise: Promise<T>): void;

/**
 * Signals a parent `DeferredContent` element to delay revealing its
 * content while any of the promises of the given references are unresolved.
 *
 * @remarks
 *
 * The returned `DeferredContentRenderer` instance can be used to create
 * a render function that receives the resolved values of the promises.
 * This allows rendering the content with the resolved data once all
 * promises have settled.
 */
export function defer<T extends PromiseReference.Collection<any>>(
  host: DeferredContentHost,
  ...references: T
): DeferredContentRenderer<T>;

/*
 * ### Private Remarks
 *
 * After the promise resolves, the underlying controller is destroyed,
 * removing itself from the host, and any associated resources are cleaned up.
 */
export function defer(
  host: DeferredContentHost,
  promiseOrReference: Promise<any> | PromiseReference<any>,
  ...otherReferences: PromiseReference.Collection<any>
): void | DeferredContentRenderer<any> {
  if (isPromiseLike(promiseOrReference)) {
    deferContentPromise(host, promiseOrReference);
    return;
  }

  const references = [promiseOrReference, ...otherReferences];

  return new DeferredContentRenderer<any>(host, references);
}

export namespace defer {
  /**
   * @internal scope: workspace
   */
  export type Renderer<T extends PromiseReference.Collection<any>> =
    DeferredContentRenderer<T>;
}
