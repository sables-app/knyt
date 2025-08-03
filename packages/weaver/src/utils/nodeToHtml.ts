/**
 * Converts a `Node` to an HTML string.
 *
 * @internal scope: workspace
 */
/*
 * ### Private Remarks
 *
 * NOTE: This doesn't support rendering elements with an `updateComplete`
 * property or a `renderToString` method. To render elements with
 * that functionality, you need to use the `render` function. `render`
 * supports full interpolation and async rendering.
 */
export function nodeToHtml($document: Document, node: Node): string {
  const template = $document.createElement("template");

  template.appendChild(node);

  return template.innerHTML;
}
