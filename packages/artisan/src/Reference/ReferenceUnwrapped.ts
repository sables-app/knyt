import type { Observer, Subscription } from "../Observable/mod.ts";
import { BasicReference } from "./BasicReference.ts";
import { isReadableReference } from "./typeGuards.ts";
import type { Reference } from "./types.ts";

function getDerivedValue<T, U>(
  options: ReferenceUnwrapped.AllOptions<T, U>,
): T | undefined {
  const { origin, derive, fallback } = options;
  const originValue = origin.value;

  if (originValue == null) {
    return fallback;
  }

  const derivedRef = derive(originValue);

  // Don't use the fallback value here.
  // We should return exactly what the derived reference returns.
  return derivedRef.value;
}

/**
 * @internal scope: workspace
 */
export class ReferenceUnwrapped<T, U>
  extends BasicReference<T | undefined>
  implements Reference.Unwrapped<T | undefined>
{
  /**
   * This retains a strong reference to the origin reference,
   * ensuring that it is not garbage collected.
   *
   * @internal scope: package
   */
  readonly #origin$: ReferenceUnwrapped.OriginReference<U>;
  readonly #getDerivedReference: ReferenceUnwrapped.DeriveHandler<T, U>;
  readonly #fallback: NonNullable<T> | undefined;

  #derived$: Reference.Readonly<T> | undefined = undefined;
  #originSubscription: Subscription | undefined = undefined;
  #derivedSubscription: Subscription | undefined = undefined;

  constructor(options: ReferenceUnwrapped.AllOptions<T, U>) {
    const { origin, derive, fallback, onUpdate, comparator } = options;

    super({
      initialValue: getDerivedValue(options),
      onUpdate,
      comparator,
    });

    this.#origin$ = origin;
    this.#getDerivedReference = derive;
    this.#fallback = fallback;

    // NOTE: The instance should subscribe to the origin reference immediately.
    //
    // To clarify, `Reference` instances are not bound to a specific host,
    // and they don't have a lifecycle. They should be setup immediately after being created.
    //
    // However, `State` instances are subscribed to based the host's lifecycle.
    // It's the responsibility of the controller managing the `State` instance to setup and teardown
    // subscriptions based on the host's lifecycle.
    this.#subscribeToOrigin();
  }

  #subscribeToOrigin() {
    if (this.#originSubscription) return;

    this.#originSubscription = this.#origin$.subscribe(this.#originObserver);
  }

  #unsubscribeFromOrigin() {
    if (!this.#originSubscription) return;

    this.#originSubscription.unsubscribe();
    this.#originSubscription = undefined;
  }

  #subscribeToDerived() {
    if (this.#derivedSubscription || !this.#derived$) {
      return;
    }

    this.#derivedSubscription = this.#derived$.subscribe(this.#derivedObserver);
  }

  #unsubscribeFromDerived() {
    if (!this.#derivedSubscription) return;

    this.#derivedSubscription.unsubscribe();
    this.#derivedSubscription = undefined;
  }

  readonly subscription: Subscription = {
    unsubscribe: (): void => {
      this.#unsubscribeFromOrigin();
      this.#unsubscribeFromDerived();
    },
  };

  #originObserver: Observer<U | undefined> = {
    next: (originValue) => {
      this.#unsubscribeFromDerived();

      if (originValue == null) {
        // If the origin value is `undefined`, we should use the fallback value.
        this.set(this.#fallback);
        return;
      }

      this.#derived$ = this.#getDerivedReference(originValue);
      // There's no need to set the value here,
      // because the value will be set when the derived reference
      // is subscribed to.
      this.#subscribeToDerived();
    },
  };

  #derivedObserver: Observer<T> = {
    next: (derivedValue) => {
      this.set(derivedValue);
    },
  };
}

/**
 * @internal scope: workspace
 */
// TODO: Avoid using `any` in the return type.
// It's used to avoid some unnecessary complexity in the type system.
// It neither affects the functionality nor development experience.
export function normalizeReferenceUnwrappedArgs<T, U>(
  params: ReferenceUnwrapped.Args<T, U>,
): ReferenceUnwrapped.AllOptions<T, any> {
  if (params.length === 1) {
    const firstParam = params[0];

    if (isReadableReference<Reference.Readonly<T> | undefined>(firstParam)) {
      return {
        origin: firstParam,
        derive: (reference) => reference,
      };
    }

    return firstParam;
  }

  const [origin, derive, fallback] = params;

  return { derive, origin, fallback };
}

export namespace ReferenceUnwrapped {
  export type DeriveHandler<T, U> = (
    value: NonNullable<U>,
  ) => Reference.Readonly<T>;

  export type OriginReference<U> = Reference.Readonly<U | undefined>;

  export type Options<T, U> = {
    origin: OriginReference<U>;
    derive: DeriveHandler<T, U>;
    /*
     * ### Private Remarks
     *
     * The `undefined` value is for when the origin reference value is `undefined`.
     * The fallback value is not used when accessing the derived reference value.
     */
    onUpdate?: Reference.UpdateHandler<T | undefined>;
    comparator?: Reference.Comparator<T | undefined>;
  };

  export type OptionsWithFallback<T, U> = {
    origin: OriginReference<U>;
    derive: DeriveHandler<T, U>;
    onUpdate?: Reference.UpdateHandler<T>;
    comparator?: Reference.Comparator<T>;
    fallback: NonNullable<T>;
  };

  /**
   * @internal scope: package
   */
  export type AllOptions<T, U> = {
    origin: OriginReference<U>;
    derive: DeriveHandler<T, U>;

    /*
     * ### Private Remarks
     *
     * The `undefined` value is for when the origin reference value is `undefined`.
     * The fallback value is not used when accessing the derived reference value.
     */

    onUpdate?: Reference.UpdateHandler<T | undefined>;
    comparator?: Reference.Comparator<T | undefined>;
    fallback?: NonNullable<T>;
  };

  export type ParamsWithHandler<T, U> = [
    origin: OriginReference<U>,
    derive: DeriveHandler<T, U>,
  ];

  export type ParamsWithFallback<T, U> = [
    origin: OriginReference<U>,
    derive: DeriveHandler<T, U>,
    fallback: NonNullable<T>,
  ];

  export type ParamsOptionsOnly<T, U> = [options: AllOptions<T, U>];

  export type ParamsWithoutHandler<T> = [
    origin: OriginReference<Reference.Readonly<T> | undefined>,
  ];

  export type Args<T, U> =
    | ParamsOptionsOnly<T, U>
    | ParamsWithFallback<T, U>
    | ParamsWithHandler<T, U>
    | ParamsWithoutHandler<T>;
}
