import {
  OBSERVABLE_PROPERTY_NAME,
  type ObservableInterop,
} from "../Observable/mod.ts";
import { __isKnytReference } from "./typeGuards.ts";
import type { Reference } from "./types.ts";

/**
 * Wrap a given reference, replacing its mutator with a custom one.
 *
 * @param origin$ - The reference to wrap.
 * @param mutator - The custom mutator to use. This function should be
 * pure and should not have side effects.
 *
 * @public
 */
export function replaceReferenceMutator<T>(
  origin$: Reference<T>,
  createMutator: (origin$: Reference<T>) => (value: T) => void,
): Reference<T> {
  const mutator = createMutator(origin$);

  // We have to assume that `set value`, `set`, and `next` are equivalent.
  // This should be a safe assumption, because if they are not equivalent
  // then the reference implementation is incorrect.

  return {
    [__isKnytReference]: true,
    get value() {
      return origin$.value;
    },
    set value(value) {
      mutator(value);
    },
    // This is a detachable method.
    get: () => {
      return origin$.get();
    },
    // This is a detachable method.
    set: (value) => {
      mutator(value);
    },
    next(value) {
      mutator(value);
    },
    asReadonly() {
      return origin$.asReadonly();
    },
    subscribe(subscriber) {
      return origin$.subscribe(subscriber);
    },
    asInterop(): ObservableInterop<T> {
      return origin$.asInterop();
    },
    [Symbol.observable](): ObservableInterop<T> {
      return origin$.asInterop();
    },
    [OBSERVABLE_PROPERTY_NAME](): ObservableInterop<T> {
      return origin$.asInterop();
    },
  };
}
