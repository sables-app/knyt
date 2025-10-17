import { defineView } from "@knyt/weaver";

import { defineComponent } from "./defineComponent/mod.ts";
import { defineElement } from "./defineElement.ts";
import { defineProperties } from "./defineProperties.ts";
import { defineProperty } from "./defineProperty.ts";

/**
 * A set of functions for defining custom elements and their properties.
 */
export const define = {
  /**
   * @deprecated This is an experimental API that WILL change without notice.
   */
  component: defineComponent,
  element: defineElement,
  /**
   * @deprecated This function is no longer needed and will be removed in the future.
   */
  // TODO: Remove this.
  properties: defineProperties,
  property: defineProperty,
  /**
   * Shorthand for `define.property()`.
   *
   * @see {@link defineProperty}
   */
  get prop(): ReturnType<typeof defineProperty<unknown>> {
    return defineProperty();
  },
  view: defineView,
} as const;
