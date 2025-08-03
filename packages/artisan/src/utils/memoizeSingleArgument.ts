/**
 * Memoizes the result of a function with a single argument using strict equality.
 *
 * @remarks
 *
 * The cache will only store the last `maxCacheSize` results.
 * This function is designed to be as simple as possible,
 * and should be used with pure functions that are expensive to compute.
 */
export function memoizeSingleArgument<T extends (payload: any) => any>(
  fn: T,
  maxCacheSize = 1,
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: any, payload: any) {
    if (cache.has(payload)) {
      return cache.get(payload);
    }

    if (cache.size >= maxCacheSize) {
      const lastKey = cache.keys().next().value;

      if (lastKey) {
        cache.delete(lastKey);
      }
    }

    const result = fn.call(this, payload);

    cache.set(payload, result);

    return result;
  } as T;
}
