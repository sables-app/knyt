import { mapRef } from "./mapRef.ts";
import type { Reference } from "./types.ts";

/**
 * A convenience function that creates a reference which falls back to a specified value
 * when the source reference's value is `null` or `undefined`.
 */
export function fallbackRef<T>(
  source: Reference.Readonly<T>,
  fallback: NonNullable<T>,
): Reference.Readonly<NonNullable<T>> {
  return mapRef(source, (value: T): NonNullable<T> => value ?? fallback);
}
