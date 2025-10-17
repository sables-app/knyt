import { isPromiseLike } from "@knyt/artisan";

import type { KnytDeclaration, RenderResult } from "../types/mod.ts";
import { createFragmentDeclaration } from "./createFragmentDeclaration.ts";
import { isKnytDeclaration } from "./KnytDeclaration.ts";

function normalizeAwaitedRenderResult(
  result: Awaited<RenderResult>,
): KnytDeclaration {
  return isKnytDeclaration(result)
    ? result
    : createFragmentDeclaration([result]);
}

/**
 * @internal scope: workspace
 */
export function normalizeRenderResult(
  result: RenderResult,
): KnytDeclaration | Promise<KnytDeclaration> {
  if (!isPromiseLike(result)) {
    return normalizeAwaitedRenderResult(result);
  }

  return result.then(normalizeAwaitedRenderResult);
}
