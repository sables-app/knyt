import type {
  ElementBuilder,
  ElementDeclaration,
  ViewBuilder,
} from "../types/mod";
import { getElementDeclarationFromViewBuilder } from "./getElementDeclarationFromViewBuilder";
import {
  getElementDeclarationFromElementBuilder,
  isElementBuilder,
  isViewBuilder,
} from "./other";

/**
 * Extracts the element declaration from a builder.
 */
export async function getElementDeclarationFromBuilder(
  builder: ViewBuilder.Input | ElementBuilder.Input,
): Promise<ElementDeclaration> {
  if (isElementBuilder(builder)) {
    return getElementDeclarationFromElementBuilder(builder);
  }
  if (isViewBuilder(builder)) {
    return getElementDeclarationFromViewBuilder(builder);
  }

  throw new Error("Unknown element kind");
}
