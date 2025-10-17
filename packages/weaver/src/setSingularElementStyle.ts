import { isUnknownDictionary, typeCheck } from "@knyt/artisan";

import { setSingularElementAttributes } from "./setSingularElementAttributes.ts";
import { setSingularElementStyleProperty } from "./setSingularElementStyleProperty.ts";
import type { ElementBuilder, SingularElement, StyleObject } from "./types/mod.ts";

// NOTE: This shouldn't be exported,
// this is just for module level type checking.
function isStyleObject(value: unknown): value is StyleObject {
  return isUnknownDictionary(value);
}

export function isNonNullableStyleInput(
  value: unknown,
): value is NonNullable<ElementBuilder.StyleInput> {
  return isStyleObject(value) || typeof value === "string";
}

export function setSingularElementStyle(
  element: SingularElement,
  prevStyle: ElementBuilder.StyleInput,
  nextStyle: NonNullable<ElementBuilder.StyleInput>,
): void {
  if (typeof nextStyle === "string") {
    const prevAttrs =
      typeof prevStyle === "string" ? { style: prevStyle } : undefined;
    const nextAttrs = { style: nextStyle };

    setSingularElementAttributes(element, prevAttrs, nextAttrs);
    return;
  }

  if (isStyleObject(nextStyle)) {
    const prevStyleValue = isStyleObject(prevStyle) ? prevStyle : undefined;

    setSingularElementStyleProperty(element, prevStyleValue, nextStyle);
    return;
  }

  // TODO: Remove in production
  typeCheck<never>(typeCheck.identify(nextStyle));

  throw new TypeError(`Invalid style input: ${typeof nextStyle}`);
}
