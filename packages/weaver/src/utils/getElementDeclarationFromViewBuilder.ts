import { html } from "../ElementBuilder.ts";
import type { ElementDeclaration, ViewBuilder } from "../types/mod.ts";
import { createFragmentDeclaration } from "./createFragmentDeclaration.ts";
import {
  getMutableElementDeclarationFromElementBuilder,
  getViewDeclaration,
  isElementDeclaration,
} from "./other.ts";

/**
 * @remarks
 *
 * This function is the reason why View's always build to a Fragment.
 *
 * We could use `flattenElement` to flatten the result before the return,
 * but that would create result in templates producing different types of
 * element declarations depending on the context.
 *
 * I would rather keep the API consistent and always return a Fragment,
 * than to have to guess/test what the result will be.
 */
export async function getElementDeclarationFromViewBuilder(
  viewBuilder: ViewBuilder.Input,
): Promise<ElementDeclaration.Fragment> {
  const view = getViewDeclaration(viewBuilder);
  const declaredChildren = view.children;
  const children =
    declaredChildren.length > 0
      ? createFragmentDeclaration(declaredChildren)
      : undefined;
  const renderOutput = await view.render(view.props, {
    children,
    ref: view.ref,
    key: view.key,
  });
  const elementBuilder = html.fragment.$children(renderOutput);
  const elementDeclaration =
    getMutableElementDeclarationFromElementBuilder(elementBuilder);

  if (!isElementDeclaration.Fragment(elementDeclaration)) {
    throw new Error("Expected a fragment");
  }

  return elementDeclaration;
}
