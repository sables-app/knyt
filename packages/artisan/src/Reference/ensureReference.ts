import type { UndefinedXorNull } from "../types/mod.ts";
import { createReference, isReadableReference, type Reference } from "./mod.ts";

/**
 * Converts a value or a readonly reference to a readonly reference for the
 * expected value. Ensures the result is always a readonly reference.
 *
 * @beta This is an experimental API and may change in future releases.
 */
export function ensureReference<T, U extends null | undefined>(
  value: Reference.Maybe<T, U>,
): Reference.Readonly<T | UndefinedXorNull<U>> {
  return isReadableReference<T | UndefinedXorNull<U>>(value)
    ? value
    : createReference<T | UndefinedXorNull<U>>(value).asReadonly();
}
