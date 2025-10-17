import { typeCheck } from "@knyt/artisan";

import type {
  ElementDeclaration,
  KnytDeclaration,
  StringDocumentFragment,
} from "../types/mod.ts";
import { isElementDeclaration } from "./other.ts";
import { resolveDeclarationTree } from "./resolveDeclarationTree.ts";

/**
 * Extracts the text from an element declaration.
 */
export async function extractDeclarationText(
  input: KnytDeclaration | undefined,
): Promise<string[]> {
  if (input === undefined) {
    return [];
  }

  const tree = await resolveDeclarationTree(input);

  const textPieces: string[] = [];

  for (const child of tree.children) {
    if (isElementDeclaration<ElementDeclaration.Tree>(child)) {
      textPieces.push(...(await extractDeclarationText(child)));
      continue;
    }
    if (typeof child === "string") {
      textPieces.push(child);
      continue;
    }
    if (typeof child === "number") {
      textPieces.push(String(child));
      continue;
    }

    // Falsy values are ignored, and DOM constructs are not included in the text.

    typeCheck<
      | false
      | Element
      | DocumentFragment
      | StringDocumentFragment
      | null
      | undefined
    >(typeCheck.identify<typeof child>());
  }

  return textPieces;
}
