import type { RenderResult } from "@knyt/weaver";

import {
  __isKnytElementComposed,
  __knytElementComposedLifecycle,
  __knytElementComposedRenderer,
} from "./constants";
import type { KnytElement } from "./KnytElement";
import type { PropertiesDefinition } from "./types";

/**
 * @internal scope: package
 */
export type RendererFn<PD extends PropertiesDefinition<any>> = (
  /**
   * @deprecated The host should be retrieved from the lifecycle function.
   *
   * ### As this API was only available in an alpha version, this WILL be removed without a major release.
   */
  this: KnytElement.FromPropertiesDefinition<PD>,
  /**
   * @deprecated The host should be retrieved from the lifecycle function.
   *
   * ### As this API was only available in an alpha version, this WILL be removed without a major release.
   */
  host: KnytElement.FromPropertiesDefinition<PD>,
) => RenderResult;

/**
 * @internal scope: package
 */
export type LifecycleFn<TProperties extends PropertiesDefinition<any>> = (
  this: KnytElement.FromPropertiesDefinition<TProperties>,

  /*
   * ### Private Remarks
   *
   * ### Decision
   *
   * It was decided to keep this parameter, because it allows
   * consumers to use arrow functions to define the lifecycle
   * function, which may be more convenient depending on the
   * context.
   *
   * However, both `host` and `this` were removed from the `RendererFn`
   * function, because they are not needed, and it helps encourage
   * the renderer to be a pure function.
   */
  host: KnytElement.FromPropertiesDefinition<TProperties>,
) => RendererFn<TProperties> | void;

/**
 * A type representing a `KnytElement` composed by `defineKnytElement`.
 *
 * @internal scope: workspace
 */
export type KnytElementComposed = KnytElement & {
  [__knytElementComposedRenderer]: () => unknown;
};

export namespace KnytElementComposed {
  /**
   * Static members added to a `KnytElementComposed` constructor.
   *
   * @internal scope: workspace
   */
  export type ConstructorStaticMembers = {
    readonly [__isKnytElementComposed]: true;
    [__knytElementComposedLifecycle]: LifecycleFn<any>;
  };

  /**
   * A type representing a `KnytElement` constructor composed by `defineKnytElement`.
   *
   * @internal scope: workspace
   */
  export type Constructor = KnytElement.Constructor<KnytElementComposed, any> &
    ConstructorStaticMembers;
}

/**
 * A type guard to check if a constructor is a FunctionKnytElement.
 *
 * @internal scope: workspace
 */
export function isKnytElementComposedConstructor(
  constructor: unknown,
): constructor is KnytElementComposed.Constructor {
  return (
    typeof constructor === "function" &&
    __isKnytElementComposed in constructor &&
    constructor[__isKnytElementComposed] === true
  );
}
