// Ban global `Node` object. The  type guards shouldn't use any globals.
declare const Node: never;

/**
 * A direct copy of the Node interface from the DOM spec.
 * This is used to avoid using the global Node type.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
 * @see https://dom.spec.whatwg.org/#interface-node
 */
enum NodeKind {
  /** The node is an element. */
  ELEMENT_NODE = 1,
  /** The node is a Text node. */
  TEXT_NODE = 3,
  /** The node is a Comment node. */
  COMMENT_NODE = 8,
  /** The node is a document. */
  DOCUMENT_NODE = 9,
  /** The node is a doctype. */
  DOCUMENT_TYPE_NODE = 10,
  /** The node is a DocumentFragment node. */
  DOCUMENT_FRAGMENT_NODE = 11,
}

export function isComment(value: unknown): value is Comment {
  return isNodeWithType(value, NodeKind.COMMENT_NODE);
}

export function isCSSMediaRule(value: unknown): value is CSSMediaRule {
  return isNonNullableObject(value) && "media" in value && "cssRules" in value;
}

export function isCSSStyleDeclaration(
  value: unknown,
): value is CSSStyleDeclaration {
  return (
    isNonNullableObject(value) && "cssText" in value && "setProperty" in value
  );
}

export function isCSSStyleRule(value: unknown): value is CSSStyleRule {
  return (
    isNonNullableObject(value) && "selectorText" in value && "style" in value
  );
}

export function isCSSStyleSheet(value: unknown): value is CSSStyleSheet {
  return (
    isNonNullableObject(value) && "cssRules" in value && "insertRule" in value
  );
}

export function isDocumentFragment(value: unknown): value is DocumentFragment {
  return isNodeWithType(value, NodeKind.DOCUMENT_FRAGMENT_NODE);
}

export function isElement(value: unknown): value is Element {
  return isNodeWithType(value, NodeKind.ELEMENT_NODE);
}

/**
 * Check if a string ends with a given search string.
 *
 * @remarks
 *
 * This is a micro-optimized version of the `String.prototype.endsWith` method.
 * It uses `slice` to check if the string ends with the specified search string.
 * It's twice as fast as the native `endsWith` in the cases we care about.
 *
 * @internal scope: workspace
 */
/*
 * ### Private Remarks
 *
 * IDC if you think micro-optimizing this is a bad idea, argue with your mom about it.
 */
function endsWith(value: string, searchString: string): boolean {
  return value.slice(searchString.length * -1) === searchString;
}

export function isElementWithNSSuffix(
  value: unknown,
  namespaceSuffix: string,
): value is Element {
  return (
    isElement(value) &&
    "namespaceURI" in value &&
    typeof value.namespaceURI === "string" &&
    endsWith(value.namespaceURI, namespaceSuffix)
  );
}

export function isHTMLElement(value: unknown): value is HTMLElement {
  return isElementWithNSSuffix(value, "html") && "style" in value;
}

export type CustomElementConstructor = {
  new (...args: any[]): HTMLElement;
  prototype: HTMLElement;
};

export function isCustomElementConstructor(
  value: unknown,
): value is CustomElementConstructor {
  return (
    typeof value === "function" &&
    "prototype" in value &&
    Object.prototype.isPrototypeOf.call(HTMLElement, value)
  );
}

export function isNode(value: unknown): value is Node {
  return (
    isNonNullableObject(value) && "nodeType" in value && "nodeName" in value
  );
}

export function isNodeWithType(
  value: unknown,
  nodeType: number,
): value is Node {
  return isNode(value) && value.nodeType === nodeType;
}

export function isNonNullableObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    isNonNullableObject(value) &&
    "then" in value &&
    typeof value.then === "function"
  );
}

export function isShadowRoot(value: unknown): value is ShadowRoot {
  return (
    isNonNullableObject(value) && "host" in value && isDocumentFragment(value)
  );
}

export function isDocument(value: unknown): value is Document {
  return isNodeWithType(value, NodeKind.DOCUMENT_NODE);
}

export function isSVGElement(value: unknown): value is SVGElement {
  return isElementWithNSSuffix(value, "svg");
}

export function isText(value: unknown): value is Text {
  return isNodeWithType(value, NodeKind.TEXT_NODE);
}

export function isUnknownDictionary(
  value: unknown,
): value is Record<string, unknown> {
  return isNonNullableObject(value) && !Array.isArray(value);
}

export function isCustomElement(value: unknown): value is HTMLElement {
  return (
    isHTMLElement(value) &&
    // All custom elements have a tag name that contains a hyphen.
    value.tagName.includes("-")
  );
}

export function isTemplateStringsArray(
  value: unknown,
): value is TemplateStringsArray {
  return (
    Array.isArray(value) &&
    // All template strings arrays have at least one string element.
    value.length > 0 &&
    typeof value[0] === "string" &&
    // All template strings arrays have a `raw` property
    "raw" in value &&
    value.raw !== undefined
  );
}
