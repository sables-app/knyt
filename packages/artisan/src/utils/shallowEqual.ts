import { strictEqual } from "./strictEqual";

type Comparator<T> = (a: T[keyof T], b: T[keyof T]) => boolean;

function shallowEqualArray<T extends any[]>(
  a: T,
  b: T,
  arrayElementComparator: Comparator<T> = strictEqual,
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (!arrayElementComparator(a[i], b[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two objects (or arrays) for shallow equality.
 *
 * @public
 */
export function shallowEqual<T extends Record<string | number, any>>(
  a: T | undefined,
  b: T | undefined,
  propertyValueComparator: Comparator<T> = strictEqual,
) {
  if (a === b) {
    return true;
  }

  if (a === undefined || b === undefined) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return shallowEqualArray(a, b);
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  const keysA = Object.keys(a) as (keyof T)[];
  const keysB = Object.keys(b) as (keyof T)[];

  if (keysA.length !== keysB.length) {
    return false;
  }

  const keys = [...new Set([...keysA, ...keysB])];

  for (const key of keys) {
    if (!propertyValueComparator(a[key], b[key])) {
      return false;
    }
  }

  return true;
}
