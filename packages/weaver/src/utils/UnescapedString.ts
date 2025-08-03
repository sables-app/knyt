import { isNonNullableObject } from "@knyt/artisan";

/**
 * A type representing a string that should not be escaped by the renderer.
 *
 * @remarks
 *
 * This type is used in the `StringDocumentFragment` type to indicate
 * that a value is a string that should not be escaped.
 *
 * Warning: This type should be used with caution, as it can lead to
 * security vulnerabilities if used incorrectly.
 *
 * @beta
 */
/*
 * ### Private Remarks
 *
 * This type should be able to normalized into a string using `String(unescapedString)`.
 */
export type UnescapedString = {
  readonly __isUnescapedString: true;
  toString: () => string;
};

export function isUnescapedString(value: unknown): value is UnescapedString {
  return (
    isNonNullableObject(value) &&
    "__isUnescapedString" in value &&
    (value as UnescapedString).__isUnescapedString === true
  );
}

export function createUnescapedString(value: string): UnescapedString {
  return {
    __isUnescapedString: true,
    toString: () => value,
  };
}
