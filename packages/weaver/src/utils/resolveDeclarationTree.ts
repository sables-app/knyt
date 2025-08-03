import type {
  ElementBuilder,
  ElementDeclaration,
  KnytDeclaration,
} from "../types/mod";
import { getElementDeclarationFromBuilder } from "./getElementDeclarationFromBuilder";
import { isBuilder } from "./isBuilder";
import { isElementDeclaration } from "./other";

/**
 * Recursively extracts the element declaration tree from a builder.
 *
 * @remarks
 *
 * The resulting tree contains only the element declarations and their children,
 * which can are only element declarations or resolved children; i.e. no promises
 * or builders.
 */
export async function resolveDeclarationTree(
  input: KnytDeclaration,
): Promise<ElementDeclaration.Tree> {
  let declaration: ElementDeclaration;

  if (isElementDeclaration(input)) {
    declaration = input;
  } else if (isBuilder(input)) {
    declaration = await getElementDeclarationFromBuilder(input);
  } else {
    throw new TypeError(
      `Expected a builder or an element declaration, but received: ${typeof input}`,
    );
  }

  return {
    ...declaration,
    children: await Promise.all(
      declaration.children.map(declarationChildToTree),
    ),
  };
}

async function declarationChildToTree(
  child: ElementBuilder.Child,
): Promise<ElementDeclaration.Tree | ElementBuilder.Child.Basic> {
  if (
    isBuilder(child) ||
    isElementDeclaration<ElementDeclaration.Input>(child)
  ) {
    return resolveDeclarationTree(child);
  }

  return child;
}
