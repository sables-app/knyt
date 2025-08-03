import {
  isDocumentFragment,
  isElement,
  isText,
  typeCheck,
} from "@knyt/artisan";

import { build } from "../build/mod";
import type {
  ElementBuilder,
  ElementDeclaration,
  FlattenedElementDeclarationChildren,
  ViewBuilder,
} from "../types/mod";
import {
  createFragmentDeclaration,
  getElementDeclarationFromElementBuilder,
  getElementDeclarationFromViewBuilder,
  isElementBuilder,
  isElementBuilderChildBasic,
  isElementDeclaration,
  isStringDocumentFragment,
  isViewBuilder,
} from "../utils/mod";
import { createSharedOptions, type UpdateOptionsWithDocument } from "./options";

type ElementOrStringList = (Element | string)[];

function documentFragmentToElementOrStringList(
  input: DocumentFragment,
): ElementOrStringList {
  const result: ElementOrStringList = [];
  const childNodes = Array.from(input.childNodes);

  for (const child of childNodes) {
    if (isElement(child)) {
      result.push(child);
    } else if (isText(child)) {
      const textContent = child.textContent;

      if (textContent === null) {
        // We don't want to preserve null text nodes.
        // The builder's don't allow building null text nodes,
        // but they may be created if a user provides
        // DocumentFragment with null text nodes.
        continue;
      }

      result.push(textContent);
    }

    // Ignore other node types (e.g. comments, etc.)
  }

  return result;
}

export async function flattenElement(
  input: ElementBuilder.Child,
  options: UpdateOptionsWithDocument,
): Promise<Readonly<FlattenedElementDeclarationChildren>> {
  if (isElementBuilderChildBasic(input)) {
    if (isElement(input)) {
      return [input];
    }
    if (isDocumentFragment(input)) {
      return documentFragmentToElementOrStringList(input);
    }
    if (isStringDocumentFragment(input)) {
      return documentFragmentToElementOrStringList(
        await build(
          createFragmentDeclaration([input]),
          createSharedOptions(options),
        ),
      );
    }
    if (typeof input == "string") {
      return [input];
    }
    if (typeof input == "number") {
      return [String(input)];
    }
    if (!input) {
      return [];
    }

    typeCheck<never>(typeCheck.identify(input));

    throw new Error("Invalid input");
  }

  let declaration: ElementDeclaration.Input | undefined;

  if (isElementBuilder<ElementBuilder.Input>(input)) {
    isElementBuilder.assertValid(input);

    declaration = getElementDeclarationFromElementBuilder(input);
  } else if (isViewBuilder<ViewBuilder.Input>(input)) {
    declaration = await getElementDeclarationFromViewBuilder(input);
  } else {
    declaration = input;
  }

  const flattenedChildren = (
    await Promise.all(
      declaration.children.map((child) => flattenElement(child, options)),
    )
  ).flat();

  if (isElementDeclaration.Fragment(declaration)) {
    return flattenedChildren;
  }
  if (isElementDeclaration.Singular(declaration)) {
    return [
      {
        ...declaration,
        children: flattenedChildren,
      },
    ];
  }

  throw new Error("Invalid input");
}
