import type { OptionalAndComplete } from "@knyt/artisan";

import type { SharedOptions } from "../types/mod";

/**
 * The default value for the `disableKeyAttributes` option
 * for the `update` function. This should be the fallback
 * value when providing options to the `build` function.
 *
 * @defaultValue true
 * @internal scope: package
 */
export const DEFAULT_DISABLE_KEY_ATTRIBUTES = true;

/**
 * @public
 */
export type UpdateOptions = SharedOptions & {
  /**
   * Threshold for appending children in chunks.
   *
   * @remarks
   *
   * If the number of children exceeds this threshold, they are appended in chunks
   * using `requestAnimationFrame` to prevent blocking the main thread.
   */
  appendChunkSize?: number;
};

/**
 * @internal scope: package
 */
export type UpdateOptionsWithDocument = UpdateOptions & {
  // The `document` options is required for building children,
  // to ensure that the children are built in the correct document.
  document: Document;
};

/**
 * @internal scope: package
 */
export function createSharedOptions(
  options: UpdateOptions,
): OptionalAndComplete<SharedOptions> {
  return {
    document: options.document ?? globalThis.document,
    logger: options.logger,
    disableKeyAttributes:
      options.disableKeyAttributes ?? DEFAULT_DISABLE_KEY_ATTRIBUTES,
  };
}
