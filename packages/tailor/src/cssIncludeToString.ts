import { isCSSStyleSheet, typeCheck } from "@knyt/artisan";

import { cssStyleSheetToString } from "./cssStyleSheetToString.ts";
import { isCSSSerializable } from "./isCSSSerializable.ts";
import type { CSSInclude } from "./types.ts";

/**
 * Converts a recognized CSS value into a string.
 *
 * @internal scope: package
 */
export function cssIncludeToString(include: CSSInclude): string {
  if (typeof include === "string") {
    return include;
  }
  if (isCSSSerializable(include)) {
    return include.toCSSString();
  }
  if (isCSSStyleSheet(include)) {
    return cssStyleSheetToString(include);
  }

  // TODO: Remove in production
  typeCheck<never>(typeCheck.identify(include));

  throw new TypeError(`Unsupported CSSInclude type: ${String(include)}`);
}
