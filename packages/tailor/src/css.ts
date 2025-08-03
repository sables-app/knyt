import {
  isCSSStyleSheet,
  isNonNullableObject,
  isTemplateStringsArray,
  typeCheck,
} from "@knyt/artisan";

import { cssTemplateTag, type CSSTemplateTagValue } from "./cssTemplateTag";
import { isCSSSerializable } from "./isCSSSerializable";
import { StyleSheet } from "./StyleSheet";
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
