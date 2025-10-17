import type { KnytContent } from "../types/mod.ts";
import { isKnytNode } from "./KnytNode.ts";

export function isKnytContent(value: unknown): value is KnytContent {
  return (
    isKnytNode(value) ||
    typeof value === "number" ||
    typeof value === "string" ||
    value == null ||
    value === false
  );
}
