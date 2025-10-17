import { defineView, type AnyProps } from "@knyt/weaver";

import type { PropertiesDefinition } from "../../types.ts";
import type { Component } from "./Component.ts";
import {
  globalComponentRegistry,
  type ComponentOptions,
} from "./ComponentControllerRegistry.ts";

/**
 * @deprecated This is an experimental API that will change in the future.
 */
// TODO: Add overload to support the `root` option as a the first argument
export function defineComponent<
  PD extends PropertiesDefinition<any>,
  E extends Element,
>(options: ComponentOptions<PD, E>): Component.FromPropertiesDefinition<PD, E> {
  return defineView(
    globalComponentRegistry.createViewRenderer(options) as any,
    {
      debug: options.debug,
    },
  ) as Component.FromPropertiesDefinition<PD, E>;
}
