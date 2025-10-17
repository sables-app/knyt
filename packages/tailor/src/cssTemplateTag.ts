import { isCSSStyleSheet, typeCheck } from "@knyt/artisan";

import { cssStyleSheetToString } from "./cssStyleSheetToString.ts";
import { isCSSSerializable } from "./isCSSSerializable.ts";
import { StyleSheet } from "./StyleSheet.ts";
import type { CSSSerializable } from "./types.ts";

/**
 * Represents a value that can be used in a CSS template tag.
 *
 * @public
 */
export type CSSTemplateTagValue =
  | string
  | number
  | CSSStyleSheet
  | CSSSerializable;

/**
 * @internal scope: package
 */
export function cssTemplateTag(
  cssText: TemplateStringsArray,
  ...values: CSSTemplateTagValue[]
): StyleSheet<{}> {
  let result = "";

  for (let i = 0; i < cssText.length; i++) {
    result += cssText[i] satisfies string;

    if (i < values.length) {
      const value = values[i];

      if (typeof value === "string" || typeof value === "number") {
        result += String(value) satisfies string;
        continue;
      }

      if (isCSSStyleSheet(value)) {
        result += cssStyleSheetToString(value) satisfies string;
        continue;
      }

      if (isCSSSerializable(value)) {
        result += value.toCSSString() satisfies string;
        continue;
      }

      // TODO: Remove in production build
      {
        typeCheck<never>(typeCheck.identify(value));
      }

      // This should be unreachable, but we'll log an error just in case,
      // and then proceed without adding the value to the result.

      // TODO: Remove in production build
      console.error(
        new TypeError(
          `Unsupported value type: ${typeof value}. Expected string, number, CSSStyleSheet, or CSSSerializable.`,
        ),
      );
    }
  }

  return StyleSheet.fromCSS(result);
}
