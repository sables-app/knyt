import type { Observable, ObservableInterop } from "../Observable/mod.ts";
import { BasicReference } from "./BasicReference.ts";
import type { Reference } from "./types.ts";

/**
 * Creates a observable reference with an initial value.
 *
 * @param initialValue The initial value of the ref.
 * @param onUpdate A callback that is called when the ref value is updated.
 *
 * @remarks
 *
 * The `onUpdate` callback is referenced strongly by the ref object,
 * but update subscriptions are weakly referenced to prevent memory leaks.
 *
 * @public
 *
 * @example
 *
 * ```ts
 * const num$ = ref(0);
 * ```
 */
export function createReference<T = Element>(
  initialValue: T,
  arg1?:
    | Reference.UpdateHandler<T>
    | Omit<BasicReference.Options<T>, "initialValue">,
): Reference<T> {
  let options: BasicReference.Options<T>;

  if (typeof arg1 === "function") {
    options = { initialValue, onUpdate: arg1 };
  } else {
    options = { ...arg1, initialValue };
  }

  return new BasicReference(options);
}

export namespace createReference {
  export function from<T>(
    initialValue: T,
  ): (
    observable: Observable<T> | ObservableInterop<T>,
  ) => Reference.Readonly.WithSubscription<T>;

  /**
   * Creates a reference from an observable.
   *
   * @remarks
   *
   * A `Reference` is an observer, so a reference can simply be provided
   * directly to a given observable's `subscribe` method to receive values.
   *
   * If the given observable is an `ObservableInterop`, it will
   * retain a strong reference to the reference, keeping the subscription
   * alive until it is explicitly unsubscribed.
   *
   * However, if the observable is a standard `Observable`, it will
   * use a weak reference for the reference, meaning that the
   * subscription will be automatically unsubscribed when either the
   * reference or the observable is garbage collected.
   */
  export function from<T>(
    observable: Observable<T> | ObservableInterop<T>,
    initialValue: T,
    updateHandlerOrOptions?:
      | Reference.UpdateHandler<T>
      | Omit<BasicReference.Options<T>, "initialValue">,
  ): Reference.Readonly.WithSubscription<T>;

  export function from<T>(
    arg0: T | Observable<T> | ObservableInterop<T>,
    arg1?: T,
    arg2?:
      | Reference.UpdateHandler<T>
      | Omit<BasicReference.Options<T>, "initialValue">,
  ):
    | Reference.Readonly.WithSubscription<T>
    | ((
        observable: Observable<T> | ObservableInterop<T>,
      ) => Reference.Readonly.WithSubscription<T>) {
    if (
      // We have to check the length and not the existence of `arg1` because,
      // because `arg1` can be `undefined`, which is a valid value for the
      // `initialValue` parameter.
      arguments.length === 1
    ) {
      const initialValue = arg0 as T;

      return (observable: Observable<T> | ObservableInterop<T>) => {
        return createReference.from(observable, initialValue);
      };
    }

    const observable = arg0 as Observable<T> | ObservableInterop<T>;
    const initialValue = arg1 as T;
    const updateHandlerOrOptions = arg2;

    const reference = createReference(initialValue, updateHandlerOrOptions);
    const subscription = observable.subscribe(reference);

    return Object.assign(reference, { subscription });
  }
}

export {
  // `ref` is an alias for `createReference` for brevity.
  // `createReference` is retained for clarity and to avoid naming collisions.
  createReference as ref,
};
