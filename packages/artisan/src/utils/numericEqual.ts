/**
 * A utility function to check if two numeric values are equal.
 *
 * @remarks
 *
 * Numeric values are those that can be converted to a number using
 * the `Number()` constructor. This includes objects with a `valueOf()`
 * method returning a number, or primitives convertible to numbers;
 * e.g. `Date`.
 *
 * @internal scope: workspace
 */
export function numericEqual<T = unknown>(a: T, b: T): boolean {
  return Number(a) === Number(b);
}
