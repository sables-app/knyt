import { createContext } from "@knyt/tasker";

import type { DeferredContentController } from "./DeferredContentController.ts";

/**
 * @internal scope: package
 */
export const DeferredContentContext =
  createContext<DeferredContentController | null>(null);
