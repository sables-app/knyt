import { shallowEqual } from "@knyt/artisan";

import type { StyleSheetMixin } from "./types";

// TODO: Rename for clarity
export function areStyleSheetMixinsEqual(
  mixinA: StyleSheetMixin<string> | undefined,
  mixinB: StyleSheetMixin<string> | undefined,
) {
  return shallowEqual(mixinA, mixinB, shallowEqual);
}
