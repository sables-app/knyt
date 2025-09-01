/**
 * Selects the last element of an array.
 */
// TODO: Add  support for `Map` and `Set`
export function last<T>(arr: readonly T[]): T | undefined {
  return arr.at(arr.length - 1);
}

/**
 * Selects the first element of an array.
 */
// TODO: Add  support for `Map` and `Set`
export function first<T>(arr: readonly T[]): T | undefined {
  return arr.at(0);
}

/**
 * Creates a selector that retrieves a property from an object.
 */
export function property<T, K extends keyof T>(key: K) {
  return (obj: T): T[K] => obj[key];
}

/**
 * Creates a selector that counts the number of elements
 * in an array or entries in a set or map.
 */
export function count<T extends { length: number } | { size: number }>(
  value: T,
): number {
  return "length" in value ? value.length : value.size;
}

/**
 * Creates a selector that retrieves the largest element
 * in an array.
 */
// TODO: Add  support for `Map` and `Set`
export function max<T extends {}>(values: T[]): T | undefined {
  return values.reduce<T | undefined>(
    (r, c) => (r === undefined || Number(c) > Number(r) ? c : r),
    undefined,
  );
}

/**
 * Creates a selector that retrieves the smallest element
 * in an array.
 */
// TODO: Add  support for `Map` and `Set`
export function min<T extends {}>(values: T[]): T | undefined {
  return values.reduce<T | undefined>(
    (r, c) => (r === undefined || Number(c) < Number(r) ? c : r),
    undefined,
  );
}

/**
 * Creates a selector that retrieves the largest element
 * in an array based on a specified property.
 */
// TODO: Add  support for `Map` and `Set`
export function withMaxBy<
  T extends Record<K, {}>,
  K extends string | number | symbol,
>(k: K): (arr: readonly T[]) => T | undefined {
  return (v) =>
    v.reduce<T | undefined>(
      (r, c) => (r === undefined || Number(c[k]) > Number(r[k]) ? c : r),
      undefined,
    );
}

/**
 * Creates a selector that retrieves the smallest element
 * in an array based on a specified property.
 */
// TODO: Add  support for `Map` and `Set`
export function withMinBy<
  T extends Record<K, {}>,
  K extends string | number | symbol,
>(k: K): (arr: readonly T[]) => T | undefined {
  return (v) =>
    v.reduce<T | undefined>(
      (r, c) => (r === undefined || Number(c[k]) < Number(r[k]) ? c : r),
      undefined,
    );
}

/**
 * Creates a selector that filters an array based on a predicate function.
 */
// TODO: Add  support for `Map` and `Set`
export function withFilter<T>(predicate: (item: T) => boolean) {
  return (arr: readonly T[]): readonly T[] => arr.filter(predicate);
}
