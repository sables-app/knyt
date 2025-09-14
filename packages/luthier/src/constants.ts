/**
 * An attribute name used to enable debugging for KnytElement.
 *
 * @remarks
 *
 * When this attribute is present on a KnytElement instance,
 * the instance's `debug` property is set to `true`, enabling debug mode.
 * This can be useful for troubleshooting and development purposes.
 *
 * A `data-` prefix is used for consistency with other Knyt specific
 * attributes. To clarify, the custom elements `observedAttributes` API
 * doesn't care about the `data-` prefix, and the attribute can be
 * observed and handled like any other attribute.
 *
 * @internal scope: workspace
 *
 * @alpha This API is subject to change without a BREAKING CHANGE notice.
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

/**
 * A symbol to identify the hot-update static method
 * on a composed `KnytElement` constructor.
 *
 * @internal scope: workspace
 */
export const __knytElementComposedHotUpdate = Symbol.for(
  "knyt.luthier.element.composed.hotUpdate",
);
