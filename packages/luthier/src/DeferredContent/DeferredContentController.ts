import { mapRef, ref, type Reference } from "@knyt/artisan";
import {
  track,
  type Context,
  type ReactiveController,
  type ReactiveControllerHost,
} from "@knyt/tasker";

import { DeferredContentContext } from "./DeferredContentContext";
import { ImmutableRegistry } from "./ImmutableRegistry";

/**
 * A controller that manages deferred content rendering based on the state of associated promises.
 *
 * @internal scope: package
 */
export class DeferredContentController implements ReactiveController {
  #host: ReactiveControllerHost;
  #provider: Context.ProviderType<DeferredContentController | null>;
  #promises$ = ref(new ImmutableRegistry<Promise<unknown>>());

  readonly isLoading$: Reference.Readonly<boolean>;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.#host = host;
    this.#provider = DeferredContentContext.createProvider(host);
    this.isLoading$ = mapRef(this.#promises$, (promises) => promises.hasAny);

    track(this.#host, this.isLoading$);

    this.#provider.set(this);
    host.addController(this);
  }

  registerPromise<T extends Promise<any>>(promise: T): T {
    if (this.#promises$.value.has(promise)) {
      return promise;
    }

    this.#promises$.set(this.#promises$.value.with(promise));

    promise.finally(() => {
      this.unregisterPromise(promise);
    });

    return promise;
  }

  unregisterPromise<T extends Promise<any>>(promise: T): void {
    if (!this.#promises$.value.has(promise)) {
      return;
    }

    this.#promises$.set(this.#promises$.value.without(promise));
  }

  hostConnected(): void {}
}
