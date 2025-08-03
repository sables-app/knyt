import { syncCustomElementRegistries } from "../syncCustomElementRegistries";
import type { ElementDeclaration, SingularElement } from "../types/mod";
import { attachElementDeclaration, isElementDeclaration } from "../utils/mod";

// Banned globals
declare const document: never;
declare const window: never;

/**
 * Create an new element to be decorated from the given element declaration.
 *
 * @internal scope: package
 */
/*
 * ### Private Remarks
 *
 * NOTE: This function is kept independent of `KnytElement` specifics.
 * This package does not depend on `@knyt/luthier` to remain agnostic to
 * particular element implementations.
 *
 * There is no library-specific logic here. If needed in the future,
 * add it in a way that avoids coupling to any library. Any special
 * initialization should be optional and abstracted for flexibility.
 */
export function createElementFromDeclaration(
  $document: Document,
  declaration: ElementDeclaration.Input,
): SingularElement.WithDeclaration<SingularElement> {
  let element = undefined as SingularElement | undefined;

  if (
    isElementDeclaration.DomSVG(declaration) ||
    isElementDeclaration.MarkupSVG(declaration)
  ) {
    element = $document.createElementNS(
      "http://www.w3.org/2000/svg",
      declaration.type,
    );
  }
  if (
    isElementDeclaration.DomHTML(declaration) ||
    isElementDeclaration.MarkupHTML(declaration)
  ) {
    const tagName = declaration.type;

    syncCustomElementRegistries(
      tagName,
      globalThis.customElements,
      $document.defaultView?.customElements,
    );

    element = $document.createElement(tagName);

    // NOTE: See "Private Remarks" about not performing any library-specific
    // initialization here.
  }
  if (isElementDeclaration.Fragment(declaration)) {
    // This should never happen.
    throw new Error("Cannot create an element from a fragment declaration.");
  }
  if (element === undefined) {
    // This should never happen.
    throw new Error("Invalid element declaration.");
  }

  return attachElementDeclaration(element, declaration);
}
