/**
 * A utility function to check strict equality between two values.
 *
 * @internal scope: workspace
 */
/*
 * ### Private Remarks
 *
 * It seems a bit silly to reuse a function this small,
 * but it was duplicated in several of spots, and I want to ensure
 * things are consistent; including the name and generic type.
 */
export function strictEqual<T = unknown>(a: T, b: T): boolean {
  return a === b;
}
