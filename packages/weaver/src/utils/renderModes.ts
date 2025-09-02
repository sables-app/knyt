/**
 * Determines how a node should be rendered by an external renderer.
 *
 * @see {@link https://knyt.dev/s/render-modes}
 *
 * @internal scope: workspace
 */
export enum RenderMode {
  /**
   * An opaque parent is an element that fully controls the
   * rendering of its children, and an external renderer
   * shouldn't change its contents.
   *
   * @public
   */
  Opaque = "opaque",
  /**
   * A transparent parent is an element that allows its
   * children to be rendered by an external renderer.
   *
   * This is the default render mode.
   *
   * @public
   */
  Transparent = "transparent",
}

/**
 * A key used to mark a node's render mode.
 */
/*
 * ### Private Remarks
 *
 * This is a string instead of a symbol to avoid issues with running
 * multiple versions of the library in the same context.
 */
const __renderMode = Symbol.for("knyt.weaver.renderMode");

export type WithRenderMode<T extends Node> = T & {
  [__renderMode]: RenderMode;
};

/**
 * Sets the render mode of the given node.
 *
 * @see {@link https://knyt.dev/s/render-modes}
 *
 * @internal scope: workspace
 */
export function setRenderMode<T extends Node>(
  node: T,
  mode: `${RenderMode}`,
): asserts node is WithRenderMode<T> {
  (node as any)[__renderMode] = mode;
}

/**
 * Gets the render mode of the given node.
 *
 * @see {@link https://knyt.dev/s/render-modes}
 *
 * @internal scope: workspace
 */
export function getRenderMode(node: Node): RenderMode | undefined {
  return (node as any)[__renderMode];
}

function checkRenderMode(node: Node, mode: RenderMode): boolean {
  return getRenderMode(node) === mode;
}

/**
 * Marks the given node as an opaque parent.
 *
 * @see {@link https://knyt.dev/s/render-modes}
 *
 * @internal scope: workspace
 */
export function markNodeAsOpaque<T extends Node>(
  node: T,
): asserts node is WithRenderMode<T> {
  setRenderMode(node, RenderMode.Opaque);
}

/**
 * Determines if the given node is an opaque parent.
 *
 * @see {@link https://knyt.dev/s/render-modes}
 *
 * @internal scope: workspace
 */
export function isNodeOpaque<T extends Node>(node: T): boolean {
  return checkRenderMode(node, RenderMode.Opaque);
}

/**
 * Marks the given node as a transparent parent.
 *
 * @see {@link https://knyt.dev/s/render-modes}
 *
 * @internal scope: workspace
 */
export function isNodeTransparent<T extends Node>(node: T): boolean {
  return checkRenderMode(node, RenderMode.Transparent);
}

/**
 * The list of all render modes.
 */
const renderModes = Object.values(RenderMode);

/**
 * Determines if the given value is a valid render mode.
 *
 * @internal scope: workspace
 */
export function isRenderMode(value: unknown): value is RenderMode {
  return typeof value === "string" && renderModes.includes(value as RenderMode);
}
