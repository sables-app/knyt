/**
 * A unique symbol used to indicate that rendering should be skipped.
 *
 * @remarks
 *
 * This symbol can be used as a sentinel value in scenarios where rendering
 * needs to be conditionally bypassed. When encountered, it signals that the
 * rendering process should not proceed for the deferred content.
 *
 * @internal scope: workspace
 */
export const SkipRenderSignal = Symbol.for("knyt.luthier.SkipRenderSignal");
