import { createSelector } from "reselect";

import type { Collection, Selector } from "./types";

/**
 * A utility function to ensure that a collection is always a readonly array.
 * If the collection is `undefined`, it returns an empty array.
 * If the collection is defined, it returns a shallow copy of the array.
 *
 * @internal scope: workspace
 */
export function ensureReadonlyArray<T extends ReadonlyArray<any>>(
  input: T | undefined,
): T {
  // Clone the array to prevent annoying warnings from `reselect`
  // saying "The result function returned its own inputs without modification."
  const ensuredReadonlyArray = input?.slice() ?? [];

  return ensuredReadonlyArray as unknown as T;
}

/**
 * @internal scope: workspace
 */
export function createArraySelector<S, T>(
  selector: (state: S) => Collection<T> | undefined,
): Selector<S, Collection<T>>;

export function createArraySelector<S, T>(
  selector: (state: S) => ReadonlyArray<T> | undefined,
): Selector<S, ReadonlyArray<T>>;

export function createArraySelector<S, T>(
  selector: (state: S) => ReadonlyArray<T> | undefined,
): Selector<S, ReadonlyArray<T>> {
  return createSelector(selector, ensureReadonlyArray);
}
