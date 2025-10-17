import { type Observer, type Subscription } from "../Observable/mod.ts";
import { strictEqual } from "../utils/mod.ts";
import { BasicReference } from "./BasicReference.ts";
import type { Reference } from "./types.ts";

/**
 * A reference that maps the value of another reference
 *
 * @remarks
 *
 * Retains a strong reference to the origin.
 *
 * @internal scope: workspace
 */
export class ReferenceMapped<TOutput, TInput>
  extends BasicReference<TOutput>
  implements Reference.SubscriberRetaining<TOutput, TInput>
{
  /**
   * @remarks
   *
   * Serves a dual purpose:
   * 1. It holds the options used to create the reference.
   * 2. It retains a strong reference to the origin,
   *   preventing it from being garbage collected while this reference exists.
   *
   * @internal scope: package
   */
  readonly #options: Readonly<ReferenceMapped.Options<TOutput, TInput>>;
  /**
   * @internal scope: package
   */
  readonly #originSubscription: Subscription;

  constructor(options: ReferenceMapped.Options<TOutput, TInput>) {
    const { comparator, origin, onUpdate, transform } = options;
    const initialValue = transform(origin.value);

    super({ initialValue, onUpdate, comparator });

    this.#options = options;

    // Subscribe to the origin as soon as the instance is created
    this.#originSubscription = origin.subscribe(this.#originObserver);
  }

  /**
   * @internal scope: package
   */
  readonly #originObserver: Observer<TInput> = {
    next: (value: TInput) => {
      const options = this.#options;
      const { comparator, transform } = options;
      const previousValue = this.get();
      const nextValue = transform.call(null, value);
      const isEqual = comparator ?? strictEqual;

      if (!isEqual(previousValue, nextValue)) {
        this.set(nextValue);
      }
    },
  };

  readonly subscription: Subscription.SubscriberRetaining<TInput> = {
    subscriber: this.#originObserver,
    unsubscribe: () => {
      this.#originSubscription.unsubscribe();
    },
  };
}

export namespace ReferenceMapped {
  export type Origin<TInput> = Reference.Readonly<TInput>;

  export type Transform<TOutput, TInput> = (value: TInput) => TOutput;

  export type Options<TOutput, TInput> = {
    /**
     * A map of dependency that the reference depends on.
     */
    origin: Origin<TInput>;
    /**
     * A function that transforms the value of the reference
     * based on the value of the dependency.
     *
     * @remarks
     *
     * This function should be pure and not have any side effects.
     */
    transform: Transform<TOutput, TInput>;
    /**
     * A function that is called when the value of the reference is updated.
     *
     * @remarks
     *
     * This function is called asynchronously after the value is updated,
     * and it is called only if the value has changed.
     * This function is called before observers are notified.
     */
    onUpdate?: Reference.UpdateHandler<TOutput>;
    /**
     * A function that compares two values for equality.
     */
    comparator?: Reference.Comparator<TOutput>;
  };

  export type Params<TOutput, TInput> = [
    ReferenceMapped.Origin<TInput>,
    ReferenceMapped.Transform<TOutput, TInput>,
  ];

  export type CurryParams<TOutput, TInput> = [
    ReferenceMapped.Transform<TOutput, TInput>,
  ];

  export type NonCurryArgs<TOutput, TInput> =
    | [ReferenceMapped.Options<TOutput, TInput>]
    | Params<TOutput, TInput>;

  export type Args<TOutput, TInput> =
    | NonCurryArgs<TOutput, TInput>
    | CurryParams<TOutput, TInput>;

  export type CurriedFn<TOutput, TInput> = (
    origin: ReferenceMapped.Origin<TInput>,
  ) => Reference.SubscriberRetaining<TOutput, TInput>;
}
