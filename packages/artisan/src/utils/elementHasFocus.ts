import { isShadowRoot } from "../typeGuards.ts";

/**
 * Determine if the element has focus.
 */
export function elementHasFocus(
  rootElement: HTMLElement | ShadowRoot,
  child?: Element,
): boolean {
  if (isShadowRoot(rootElement)) {
    if (child) {
      return child === rootElement.activeElement;
    } else {
      return rootElement.activeElement !== null;
    }
  }

  const localDocument = rootElement.ownerDocument;

  if (child) {
    return child === localDocument.activeElement;
  } else {
    return rootElement.contains(localDocument.activeElement);
  }
}
