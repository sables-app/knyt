import type { KnytDeclaration } from "../types/mod";
import { isBuilder } from "./isBuilder";
import { isElementDeclaration } from "./other";

export function isKnytDeclaration(value: unknown): value is KnytDeclaration {
  return isBuilder(value) || isElementDeclaration(value);
}
