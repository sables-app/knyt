import { __isKnytElementDefinition } from "./constants.ts";
import type { ElementDefinition } from "./types.ts";

export function isElementDefinition<
  T extends ElementDefinition<any, any, any, any> = ElementDefinition.Unknown,
>(value: unknown): value is T {
  return (
    typeof value === "function" &&
    __isKnytElementDefinition in value &&
    value[__isKnytElementDefinition] === true
  );
}
