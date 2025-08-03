/**
 * QuerySelector that can query elements inside an open shadow DOM
 * Credit: https://stackoverflow.com/a/75794900
 *
 * TODO: Decide whether to use this or not
 */
export const querySelectorOpenShadowDOM: typeof document.querySelector = function querySelectorOpenShadowDOM(
  selector: string,
  _root?: Document | ShadowRoot | null
) {
  const root = _root ?? document;
  const nodes = Array.from(root.querySelectorAll(selector));
  const shadowNodes = Array.from(root.querySelectorAll(":empty")).filter(
    (node) => node.shadowRoot
  );

  shadowNodes.map((shNode) => {
    nodes.push(...querySelectorOpenShadowDOM(selector, shNode.shadowRoot));
  });

  return nodes;
};
