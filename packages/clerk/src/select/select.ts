import {
  createSelector,
  type SelectorBuilder,
  type SelectorCollection,
} from "./createSelector";

export function select<TSelectors extends SelectorCollection<any>>(
  ...selectors: TSelectors
): SelectorBuilder<TSelectors> {
  return createSelector(...selectors);
}

export namespace select {
  /**
   * Selects the last element of an array.
   */
  export function lastELement<T>(arr: readonly T[]): T | undefined {
    return arr.at(arr.length - 1);
  }

  /**
   * Selects the first element of an array.
   */
  export function firstElement<T>(arr: readonly T[]): T | undefined {
    return arr.at(0);
  }

  /**
   * Creates a selector that retrieves a property from an object.
   */
  export function property<T, K extends keyof T>(key: K) {
    return (obj: T): T[K] => obj[key];
  }
}
