import type {
  ElementBuilder,
  ElementDeclaration,
  ViewBuilder,
} from "../types/mod.ts";
import { getElementDeclarationFromViewBuilder } from "./getElementDeclarationFromViewBuilder.ts";
import {
  getElementDeclarationFromElementBuilder,
  isElementBuilder,
  isViewBuilder,
} from "./other.ts";

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
