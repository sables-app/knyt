import { mapRef, type Reference } from "@knyt/artisan";

import type { Selector } from "./types";

/**
 * A dictionary of selectors
 *
 * @internal scope: workspace
 */
export type SelectorDictionary<S> = Record<string, Selector<S, any>>;

/**
 * A read-only facade for accessing selected values from a `Reference`
 *
 * @internal scope: workspace
 */
export type ReferenceAccessor<T> = {
  [K in keyof T as K extends string ? `${K}$` : never]: T[K] extends Selector<
    infer I,
    infer O
  >
    ? Reference.Readonly<O>
    : never;
} & {
  [K in keyof T as K extends string ? `${K}` : never]: T[K] extends Selector<
    infer I,
    infer O
  >
    ? O
    : never;
} & {
  [K in keyof T as K extends string
    ? `select${Capitalize<K>}`
    : never]: T[K] extends Selector<any, any> ? T[K] : never;
};

/**
 * Creates an accessor that provides access to selected values from
 * a given `Reference`.
 *
 * @internal scope: workspace
 */
export function createAccessor<S, T extends SelectorDictionary<S>>(
  reference: Reference.Readonly<S>,
  input: T,
): ReferenceAccessor<T> {
  const accessor = {} as any;

  for (const key in input) {
    const selector = input[key];
    const selectorKey = `select${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    const selectedRefKey = `${key}$`;
    const selectedRef = mapRef(reference, selector);

    accessor[selectedRefKey] = selectedRef;
    accessor[selectorKey] = selector;

    Object.defineProperty(accessor, key, {
      // The `selectedRef` shouldn't be used, because it's updated asynchronously.
      // Instead, use the selector function to get the current value from the original reference.
      // If the selector is memoized, like it should be, this potentially running the selector function
      // directly on the reference shouldn't be a performance issue even if the selector is computationally expensive.
      get: () => selector(reference.value),
    });
  }

  return accessor;
}
