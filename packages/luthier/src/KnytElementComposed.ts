import type { RenderResult } from "@knyt/weaver";

import {
  __isKnytElementComposed,
  __knytElementComposedRenderer,
  type __knytElementComposedHotUpdate,
  type __knytElementComposedLifecycle,
} from "./constants.ts";
import type { KnytElement } from "./KnytElement.ts";
import type { HTMLElementConstructor, PropertiesDefinition } from "./types.ts";

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
 * An HMR hook that is called whenever the constructor is updated.
 *
 * @remarks
 *
 * The function shouldn't return a promise, because we don't want to
 * encourage any wait logic. The HMR process should simply be fire-and-forget.
 * Generally speaking, the update should occur within a few microtasks,
 * and not await any element operations.
 *
 * @internal scope: package
 */
export type HotUpdateFn = (params: HotUpdateFn.Params) => void;

export namespace HotUpdateFn {
  export type Params = {
    tagName: string;
    nextConstructor: KnytElementComposed.Constructor;
    instances: HTMLElement[];
  };
}

/**
 * A type representing a `KnytElement` composed by `defineKnytElement`.
 *
 * @internal scope: workspace
 */
export type KnytElementComposed = KnytElement & {
  [__knytElementComposedRenderer]: RendererFn<any>;
};

export namespace KnytElementComposed {
  /**
   * Static members added to a `KnytElementComposed` constructor.
   *
   * @internal scope: workspace
   */
  export type ConstructorStaticMembers = {
    /**
     * A marker to identify a `KnytElementComposed` constructor.
     *
     * @internal scope: workspace
     */
    readonly [__isKnytElementComposed]: true;
    /**
     * The lifecycle function used to create the renderer.
     *
     * @internal scope: workspace
     */
    [__knytElementComposedLifecycle]: LifecycleFn<any>;
    /**
     * An HMR hook that is called whenever the constructor is updated.
     *
     * @internal scope: workspace
     *
     * @remarks
     *
     * Despite being optional, this method is NOT detachable from the constructor.
     * It must be called with the constructor as `this` context.
     */
    [__knytElementComposedHotUpdate]?: HotUpdateFn;
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
 * A type guard to check if an element is a `KnytElementComposed`.
 *
 * @internal scope: workspace
 */
export function isKnytElementComposed(
  element: HTMLElement | undefined,
): element is KnytElementComposed {
  return (
    typeof element === "object" &&
    __knytElementComposedRenderer in element &&
    typeof element[__knytElementComposedRenderer] === "function"
  );
}

/**
 * A type guard to check if a constructor is a `KnytElementComposed.Constructor`.
 *
 * @internal scope: workspace
 */
export function isKnytElementComposedConstructor(
  constructor: HTMLElementConstructor | undefined,
): constructor is KnytElementComposed.Constructor {
  return (
    typeof constructor === "function" &&
    __isKnytElementComposed in constructor &&
    constructor[__isKnytElementComposed] === true
  );
}
