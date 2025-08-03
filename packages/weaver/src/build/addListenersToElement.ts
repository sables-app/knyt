import type { InferNativeHandler } from "../inferHelpers";
import type {
  ElementDeclarationListeners,
  SingularElement,
} from "../types/mod";

/**
 * Adds event listeners to an element.
 */
export function addListenersToElement<E extends SingularElement>(
  element: E,
  listeners: ElementDeclarationListeners<E>,
): void {
  for (const key in listeners) {
    const { type, handler, options } = listeners[key];

    element.addEventListener(
      type,
      // Type assertion is necessary because the `handler` type is not compatible
      // with the native DOM event handler, due to the `target` property
      // being required in the `handler` type.
      handler as InferNativeHandler<typeof handler>,
      options,
    );
  }
}
