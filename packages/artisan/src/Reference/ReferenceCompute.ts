import {
  SubscriptionRegistry,
  type Observer,
  type Subscription,
} from "../Observable/mod";
import { BasicReference } from "./BasicReference";
import type { Reference } from "./types";

function getDependencyValues<T, V extends any[]>(
  options: ReferenceCompute.Options<T, V>,
): V {
  const { dependencies } = options;
  const values: any[] = [];

  for (const dep of dependencies) {
    values.push(dep.value);
  }

  return values as V;
}

function computeValue<T, V extends any[]>(
  options: ReferenceCompute.Options<T, V>,
) {
  const { compute } = options;
  const values = getDependencyValues(options);

  // eslint-disable-next-line prefer-spread
  return compute.apply(null, values);
}

/**
 * @internal scope: package
 */
export class ReferenceCompute<T, V extends any[]>
  extends BasicReference<T>
  implements Reference.SubscriberRetaining<T>
{
  /**
   * @remarks
   *
   * Serves a dual purpose:
   * 1. It holds the options used to create the reference.
   * 2. It retains a strong reference to the dependencies,
   *   ensuring they are not garbage collected while this reference exists.
   *
   * @internal scope: package
   */
  readonly #options: Readonly<ReferenceCompute.Options<T, V>>;
  /**
   * @internal scope: package
   */
  #updatePending = false;
  /**
   * @internal scope: package
   */
  readonly #subscriptionRegistry = new SubscriptionRegistry();

  constructor(options: ReferenceCompute.Options<T, V>) {
    const { comparator, onUpdate } = options;
    const initialValue = computeValue(options);

    super({ initialValue, onUpdate, comparator });

    this.#options = options;

    // Subscribe to dependencies as soon as the object is created.
    this.#subscribeToDependencies();
  }

  #dependencyObserver: Observer<T> = {
    next: (): void => {
      if (this.#updatePending) return;

      this.#updatePending = true;

      queueMicrotask(() => {
        this.#updatePending = false;

        // Computation is performed just before the value is set,
        // so that the value is computed only once per update,
        // even if multiple dependencies have changed.
        // This ensures that the value is up-to-date.
        const value = computeValue(this.#options);

        this.set(value);
      });
    },
  };

  readonly subscription: Subscription.SubscriberRetaining<T> = {
    subscriber: this.#dependencyObserver,
    /**
     * @detachable
     */
    unsubscribe: () => {
      this.#subscriptionRegistry.unsubscribeAll();
    },
  };

  #subscribeToDependencies() {
    const { dependencies } = this.#options;

    for (const key in dependencies) {
      const subscription = dependencies[key].subscribe(
        this.#dependencyObserver,
      );

      this.#subscriptionRegistry.add(subscription);
    }
  }
}

export namespace ReferenceCompute {
  export type Dependencies<V extends any[]> = {
    readonly [K in keyof V]: Reference.Readonly<V[K]>;
  };

  export type Compute<T, V extends any[]> = (...values: V) => T;

  export type Options<T, V extends any[]> = {
    /**
     * A map of dependencies that the reference depends on.
     */
    dependencies: Dependencies<V>;
    /**
     * A function that computes the value of the reference
     * based on the values of the dependencies.
     *
     * @remarks
     *
     * This function should be pure and not have any side effects.
     */
    compute: Compute<T, V>;
    /**
     * A function that is called when the value of the reference is updated.
     *
     * @remarks
     *
     * This function is called asynchronously after the value is updated,
     * and it is called only if the value has changed.
     * This function is called before observers are notified.
     */
    onUpdate?: Reference.UpdateHandler<T>;
    /**
     * A function that compares two values for equality.
     */
    comparator?: Reference.Comparator<T>;
  };

  export type Params<T, V extends any[]> = [
    ...ReferenceCompute.Dependencies<V>,
    ReferenceCompute.Compute<T, V>,
  ];

  export type Args<T, V extends any[]> =
    | [ReferenceCompute.Options<T, V>]
    | Params<T, V>;
}
