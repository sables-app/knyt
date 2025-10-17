import { escapeHtml, isNonNullableObject, typeCheck } from "@knyt/artisan";

import type { StringDocumentFragment } from "../types/mod.ts";
import { stringToTemplateStringsArray } from "./stringToTemplateStringsArray.ts";
import { isUnescapedString } from "./UnescapedString.ts";

export function isStringDocumentFragment(
  value: unknown,
): value is StringDocumentFragment {
  return (
    isNonNullableObject(value) &&
    "__isStringDocumentFragment" in value &&
    value.__isStringDocumentFragment === true
  );
}

export function createStringDocumentFragment(
  markup: TemplateStringsArray,
  values: StringDocumentFragment.WithStringsOnly.Value[],
): StringDocumentFragment.WithStringsOnly;

export function createStringDocumentFragment(
  markup: TemplateStringsArray,
  values: StringDocumentFragment.Value[],
): StringDocumentFragment;

export function createStringDocumentFragment(
  markup: TemplateStringsArray,
  values: StringDocumentFragment.Value[],
): StringDocumentFragment {
  return {
    __isStringDocumentFragment: true,
    markup,
    values,
  };
}

export namespace createStringDocumentFragment {
  export function fromString(
    markup: string,
  ): StringDocumentFragment.WithStringsOnly {
    return createStringDocumentFragment(
      stringToTemplateStringsArray(markup),
      [],
    ) as StringDocumentFragment.WithStringsOnly;
  }
}

function isStringValue(
  value: unknown,
): value is StringDocumentFragment.WithStringsOnly.Value {
  return typeof value === "string" || isUnescapedString(value);
}

export function containsOnlyStrings(
  input: StringDocumentFragment,
): input is StringDocumentFragment.WithStringsOnly {
  const { markup, values } = input;

  if (markup.length !== values.length + 1) {
    return false;
  }

  for (const value of values) {
    if (!isStringValue(value)) {
      return false;
    }
  }

  return true;
}

export function renderStringsOnlyFragment({
  markup,
  values,
}: StringDocumentFragment.WithStringsOnly): string {
  let html = "";

  for (let i = 0; i < markup.length; i++) {
    html += markup[i];

    if (i < values.length) {
      const value = values[i];

      if (isUnescapedString(value)) {
        html += String(value);
      } else if (typeof value === "string") {
        html += escapeHtml(value);
      } else {
        // TODO: Remove in production
        typeCheck<never>(typeCheck.identify(value));

        throw new TypeError(
          `Expected a string or UnescapedString, but got: ${typeof value}`,
        );
      }
    }
  }

  return html;
}
