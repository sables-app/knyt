import { isElement } from "@knyt/artisan";

import type { KnytNode } from "../types/mod";
import { isKnytDeclaration } from "./KnytDeclaration";

export function isKnytNode(value: unknown): value is KnytNode {
  return isElement(value) || isKnytDeclaration(value);
}
