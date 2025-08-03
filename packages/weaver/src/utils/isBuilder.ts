import type { Builder } from "../types/mod";
import { isElementBuilder, isViewBuilder } from "./other";

/**
 * Extracts the element declaration from a builder.
 */
export function isBuilder(value: unknown): value is Builder {
  return isViewBuilder(value) || isElementBuilder(value);
}
