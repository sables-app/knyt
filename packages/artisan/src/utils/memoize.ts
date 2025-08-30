/**
 * Allows distinguishing between calls with no arguments and calls with `undefined`.
 */
const NO_ARG_KEY = Symbol("knyt.artisan.noArgKey");

/**
 * Memoizes the result of a function with a single argument using strict equality.
 *
 * @remarks
 *
 * The cache will only store the last `maxCacheSize` results.
 * This function is designed to be as simple as possible,
 * and should be used with pure functions that are expensive to compute.
 *
 * @internal scope: package
 */
export function memoizeOne<T extends (payload?: any) => any>(
  fn: T,
  maxCacheSize = 1,
): T {
  const cache = new Map<any, ReturnType<T>>();

  return function (this: any, payload?: any) {
    const cacheKey = arguments.length === 0 ? NO_ARG_KEY : payload;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    if (cache.size >= maxCacheSize) {
      const lastKey = cache.keys().next().value;

      if (lastKey) {
        cache.delete(lastKey);
      }
    }

    const result = fn.call(this, payload);

    cache.set(cacheKey, result);

    return result;
  } as T;
}

/**
 * Memoizes the result of a function with any number of arguments.
 *
 * @remarks
 *
 * The cache will only store the last `maxCacheSize` results.
 * Uses a simple array of argument references as the cache key.
 * Only use with primitive or reference-stable arguments.
 *
 * @internal scope: package
 */
export function memoizeMany<T extends (...args: any[]) => any>(
  fn: T,
  maxCacheSize = 1,
): T {
  type CacheEntry = { args: any[]; result: ReturnType<T> };
  const cache: CacheEntry[] = [];

  return function (this: any, ...args: any[]) {
    // Find a cache entry with the same arguments (by reference or primitive equality)
    // TODO: Benchmark performance for large caches and consider using a Map of Maps for better performance
    for (const entry of cache) {
      if (
        entry.args.length === args.length &&
        entry.args.every((v, i) => v === args[i])
      ) {
        return entry.result;
      }
    }

    if (cache.length >= maxCacheSize) {
      cache.shift();
    }

    const result = fn.apply(this, args);

    cache.push({ args: [...args], result });

    return result;
  } as T;
}

/**
 * Memoizes the result of a function with any number of arguments.
 *
 * @remarks
 *
 * Chooses between `memoizeOne` and `memoizeMany` based on the number of arguments.
 * The cache will only store the last `maxCacheSize` results.
 *
 * @public
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxCacheSize = 1,
): T {
  if (fn.length <= 1) {
    return memoizeOne(fn, maxCacheSize);
  }

  return memoizeMany(fn, maxCacheSize);
}
