import type { Reference } from "./types";

/**
 * @internal scope: workspace
 */
export const __isKnytReference = Symbol.for("knyt.artisan.reference");

/**
 * Determines whether the given value is a reference that can be read from.
 */
/*
 * ### Private Remarks
 *
 * Instead of being named `isReference` or `isReferenceReadonly`, this function
 * is named `isReadableReference` to avoid confusion with whether the value is a
 * specific type of reference, but rather verifies if the value is valid for
 * specific operations.
 *
 * There's also the confusion of a function named `isReference` that would
 * type guard to `Reference.Readonly<T>`, which `isReadableReference` avoids.
 */
export function isReadableReference<T = unknown>(
  value: unknown,
): value is Reference.Readonly<T> {
  return (
    value != null &&
    (typeof value == "object" || typeof value == "function") &&
    __isKnytReference in value &&
    (value as Reference.Readonly<T>)[__isKnytReference] === true
  );
}

/**
 * Determines whether the given value is a reference that can be mutated.
 */
export function isMutableReference<T = unknown>(
  value: unknown,
): value is Reference<T> {
  return (
    isReadableReference(value) &&
    "set" in value &&
    typeof value.set === "function"
  );
}
