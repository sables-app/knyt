import type { KnytContent } from "../types/mod";
import { isKnytNode } from "./KnytNode";

export function isKnytContent(value: unknown): value is KnytContent {
  return (
    isKnytNode(value) ||
    typeof value === "number" ||
    typeof value === "string" ||
    value == null ||
    value === false
  );
}
