import { isElement } from "@knyt/artisan";

import type { KnytNode } from "../types/mod.ts";
import { isKnytDeclaration } from "./KnytDeclaration.ts";

export function isKnytNode(value: unknown): value is KnytNode {
  return isElement(value) || isKnytDeclaration(value);
}
