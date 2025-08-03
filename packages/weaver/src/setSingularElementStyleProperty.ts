import type { SingularElement, StyleObject } from "./types/mod";

export function setSingularElementStyleProperty(
  element: SingularElement,
  prevStyle: StyleObject | undefined,
  nextStyle: StyleObject,
): void {
  const merged: StyleObject = { ...prevStyle, ...nextStyle };

  for (const _key in merged) {
    const key = _key as keyof StyleObject;
    /**
     * If the was a previous style declaration,
     * and the key exists in it,
     * we can assume that the style property was set previously.
     * This allows us to skip the update if the value is the same.
     */
    const hasPrevValue = prevStyle && key in prevStyle;

    // Values are normalized into strings, and nullish values are
    // converted to empty strings to ensure that the previous style
    // properties are removed.

    const prevValue = String(prevStyle?.[key] ?? "");
    const nextValue = String(nextStyle?.[key] ?? "");

    if (hasPrevValue && prevValue === nextValue) {
      // If the previous and next declaration values are the same,
      // we _assume_ that the style property is already set correctly,
      // and we can skip the update.
      continue;
    }

    if (key.charAt(0) === "-") {
      const currentValue = element.style.getPropertyValue(key);

      if (currentValue !== nextValue) {
        element.style.setProperty(key, nextValue);
      }
    } else {
      // Type cast to `any` here avoids an unhelpful TS error on specific keys for `CSSStyleDeclaration`.
      // Using `keyof CSSStyleDeclaration` isn't enough, and it's not worth the effort to deal with it.
      const stylePropertyName = key as any;
      const currentValue = element.style[stylePropertyName];

      if (currentValue !== nextValue) {
        element.style[stylePropertyName] = nextValue;
      }
    }
  }
}
