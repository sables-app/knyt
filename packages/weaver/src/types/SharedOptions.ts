export type SharedOptions = {
  /**
   * A logger to use for debugging.
   */
  logger?: Partial<typeof console>;
  /**
   * The document to use for rendering.
   * If not provided, the current document will be used.
   *
   * @remarks
   *
   * This is useful for containing the rendered elements in a specific document,
   * such as when server-side rendering.
   */
  document?: Document;
  /**
   * If true, will disable rendering `data-knytkey` attributes on rendered elements.
   *
   * @remarks
   *
   * Key attributes are rendered by default when using the `render` function,
   * but are not rendered by default when using the `build` or `update` functions.
   */
  disableKeyAttributes?: boolean;
};
