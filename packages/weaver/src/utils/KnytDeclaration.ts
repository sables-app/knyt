import type { KnytDeclaration } from "../types/mod.ts";
import { isBuilder } from "./isBuilder.ts";
import { isElementDeclaration } from "./other.ts";

export function isKnytDeclaration(value: unknown): value is KnytDeclaration {
  return isBuilder(value) || isElementDeclaration(value);
}
