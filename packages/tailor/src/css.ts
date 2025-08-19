import {
  isCSSStyleSheet,
  isNonNullableObject,
  isTemplateStringsArray,
  typeCheck,
} from "@knyt/artisan";

import { CSSLength } from "./CSSLength";
import { CSSPercentage } from "./CSSPercentage";
import { cssTemplateTag, type CSSTemplateTagValue } from "./cssTemplateTag";
import { isCSSSerializable } from "./isCSSSerializable";
import { StyleSheet } from "./StyleSheet";
import { toSize } from "./toSize";
import type { CSSInclude, CSSRules } from "./types";

/**
 * Creates a new StyleSheet from the provided CSS input.
 *
 * @see {@link StyleSheet}
 */
export function css(
  input: CSSInclude,
  options?: StyleSheet.Options,
): StyleSheet<{}>;

export function css<T extends CSSRules<string>>(
  rules: T & CSSRules<string>,
  options?: StyleSheet.Options,
): StyleSheet<T>;

export function css(
  cssText: TemplateStringsArray,
  ...values: CSSTemplateTagValue[]
): StyleSheet<{}>;

export function css(
  input: CSSInclude | CSSRules<any> | TemplateStringsArray,
  ...args: [
    firstArg?: StyleSheet.Options | CSSTemplateTagValue,
    ...otherTagValues: CSSTemplateTagValue[],
  ]
): StyleSheet<any> {
  if (isTemplateStringsArray(input)) {
    const tagValues = args as CSSTemplateTagValue[];

    return cssTemplateTag(input, ...tagValues);
  }
  if (isCSSStyleSheet(input)) {
    const [options] = args as [StyleSheet.Options];

    return StyleSheet.fromCSSStyleSheet(input, options);
  }
  if (typeof input === "string" || isCSSSerializable(input)) {
    const [options] = args as [StyleSheet.Options];

    return StyleSheet.fromCSS(input, options);
  }
  if (isNonNullableObject(input)) {
    const [options] = args as [StyleSheet.Options];

    return StyleSheet.fromRules(input, options);
  }

  typeCheck<never>(typeCheck.identify(input));

  throw new TypeError(`Invalid CSS input type: ${String(input)}.`);
}

export namespace css {
  /**
   * Convert the given value into either a `CSSLength` or `CSSPercentage`.
   *
   * @throws If the value is not recognized.
   * @remarks Given number value are assumed to be pixel units.
   *
   * @alpha This is an alpha export and WILL change (or be removed) in the future
   * without warning.
   */
  export const size = toSize;

  export const len = CSSLength.from;

  export const pct = CSSPercentage.from;
}
