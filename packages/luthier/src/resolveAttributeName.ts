import type { AttributeName } from "./types.ts";

export function resolveAttributeName(
  attributeName: AttributeName,
): string | undefined {
  if (attributeName) {
    // Attribute names are case-insensitive, but _should_ be lower case.
    return attributeName.toLowerCase();
  }

  return undefined;
}
