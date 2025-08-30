import { memoize } from "@knyt/artisan";

import type { Selector } from "./types";

/**
 * @internal scope: module
 */
export type SelectorBuilder<TSelectors extends SelectorCollection<any>> = {
  combine<T>(
    combiner: SelectorBuilder.Combiner<TSelectors, T>,
    maxCacheSize?: number,
  ): Selector<SelectorCollection.ToState<TSelectors>, T>;
};

/**
 * @internal scope: module
 */
export namespace SelectorBuilder {
  /**
   * @internal scope: module
   */
  export type Combiner<TSelectors extends SelectorCollection<any>, T> = (
    ...args: SelectorCollection.ToCombinerArgs<TSelectors>
  ) => T;
}

/**
 * @internal scope: module
 */
export type SelectorCollection<S> = [...selectors: Array<Selector<S, any>>];

/**
 * @internal scope: module
 */
export namespace SelectorCollection {
  /**
   * @internal scope: module
   */
  export type ToState<T> = T extends SelectorCollection<infer S> ? S : never;

  /**
   * @internal scope: module
   */
  export type ToCombinerArgs<TSelectors extends SelectorCollection<any>> = {
    [K in keyof TSelectors]: TSelectors[K] extends Selector<any, infer R>
      ? R
      : never;
  };
}

/**
 * Creates a selector by combining multiple selectors with a combiner function.
 *
 * The resulting selector is memoized and will only recompute when the input selectors' results change.
 *
 * @public
 */
export function select<TSelectors extends SelectorCollection<any>>(
  ...selectors: TSelectors
): SelectorBuilder<TSelectors> {
  return {
    // The default `maxCacheSize` is set to `1`, caching only the most recent result.
    // Since selectors are generally invoked with the same state object reference,
    // increasing the cache size is rarely needed. Explicitly setting it to `1` here
    // ensures predictable behavior, regardless of the default in `memoize`.
    combine(combiner, maxCacheSize = 1) {
      const memoizedCombiner = memoize(combiner, maxCacheSize);

      return (state) => {
        const combinerArgs = selectors.map((selector) =>
          selector(state),
        ) as SelectorCollection.ToCombinerArgs<TSelectors>;

        return memoizedCombiner(...combinerArgs);
      };
    },
  };
}
