import { isNonNullableObject } from "@knyt/artisan";

import type { CSSSerializable } from "./types.ts";

/**
 * Checks if a value is serializable to CSS.
 */
export function isCSSSerializable(value: unknown): value is CSSSerializable {
  return (
    isNonNullableObject(value) &&
    "toCSSString" in value &&
    typeof (value as CSSSerializable).toCSSString === "function"
  );
}
