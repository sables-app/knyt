/**
 * An attribute name used to enable debugging for KnytElement.
 *
 * @internal scope: workspace
 */
export const KNYT_DEBUG_DATA_ATTR = "data-knytdebug";

/**
 * A unique symbol used to mark KnytElement definitions.
 *
 * @internal scope: package
 */
export const __isKnytElementDefinition = Symbol.for(
  "knyt.luthier.element.definition",
);

/**
 * A unique symbol used to mark composed `KnytElement` constructors
 * (as returned by `defineKnytElement`).
 *
 * @internal scope: package
 */
export const __isKnytElementComposed = Symbol.for(
  "knyt.luthier.element.composed",
);

/**
 * A symbol to identify the lifecycle static method
 * on a composed `KnytElement` constructor.
 *
 * @internal scope: workspace
 */
export const __knytElementComposedLifecycle = Symbol.for(
  "knyt.luthier.element.composed.lifecycle",
);

/**
 * A symbol to identify the renderer method
 * on a `KnytElement` instance.
 *
 * @internal scope: workspace
 */
export const __knytElementComposedRenderer = Symbol.for(
  "knyt.luthier.element.composed.renderer",
);
