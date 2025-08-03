import { typeCheck } from "@knyt/artisan";

import type {
  AttributeDictionary,
  AttributeValue,
  SingularElement,
} from "./types/mod";

/**
 * Sets an attribute on an element.
 *
 * @remarks
 *
 * NOTE: This function only sets the attribute on the element,
 * it does not remove any existing attributes.
 */
function setElementAttribute(
  element: Element,
  key: string,
  value: AttributeValue,
): void {
  if (value == null) {
    // Ignore null and undefined values
    return;
  }
  if (typeof value === "boolean") {
    element.toggleAttribute(key, value);
    return;
  }
  if (typeof value === "string" || typeof value === "number") {
    element.setAttribute(key, String(value));
    return;
  }
  if (typeof value === "object") {
    element.setAttribute(key, JSON.stringify(value));
    return;
  }

  // TODO: Remove in production
  {
    typeCheck<never>(typeCheck.identify(value));

    throw new TypeError(
      `Invalid attribute value type: ${typeof value}. Expected string, boolean, or object.`,
    );
  }
}

export function setSingularElementAttributes(
  element: SingularElement,
  prevAttributes: AttributeDictionary | undefined,
  nextAttributes: AttributeDictionary,
): void {
  const mergedAttributes = { ...prevAttributes, ...nextAttributes };

  for (const attributeName in mergedAttributes) {
    const nextValue = nextAttributes[attributeName];

    if (
      prevAttributes &&
      attributeName in prevAttributes &&
      prevAttributes[attributeName] === nextValue
    ) {
      // If the value is the same, skip changing the attribute.
      continue;
    }

    if (
      (nextValue == null || nextValue === false) &&
      (prevAttributes == null || attributeName in prevAttributes)
    ) {
      element.removeAttribute(attributeName);
    } else {
      setElementAttribute(element, attributeName, nextValue);
    }
  }
}
