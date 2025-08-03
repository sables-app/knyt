import type { ElementDefinition } from "./types";

export function isElementDefinition<
  T extends ElementDefinition<any, any, any, any> = ElementDefinition.Unknown,
>(value: unknown): value is T {
  return (
    typeof value === "function" &&
    "__isKnytElementDefinition" in value &&
    value.__isKnytElementDefinition === true
  );
}
