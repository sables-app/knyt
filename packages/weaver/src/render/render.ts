import {
  escapeAttributeValue,
  escapeHtml,
  isDocumentFragment,
  isElement,
  sanitizeAttributeName,
  typeCheck,
  type OptionalAndComplete,
} from "@knyt/artisan";

import { build } from "../build/mod.ts";
import { KEY_ATTRIBUTE } from "../constants.ts";
import { renderCSS } from "../CSSRenderer.ts";
import { shouldRecognizeChildren } from "../shouldRecognizeChildren.ts";
import { syncCustomElementRegistries } from "../syncCustomElementRegistries.ts";
import type {
  AnyProps,
  AttributeDictionary,
  AttributeValue,
  ElementBuilder,
  ElementDeclaration,
  KnytDeclaration,
  SharedOptions,
  SingularElement,
  StringDocumentFragment,
} from "../types/mod.ts";
import {
  isUpdatableHost,
  uponElementUpdatesSettled,
} from "../uponElementUpdatesSettled.ts";
import {
  containsOnlyStrings,
  createFragmentDeclaration,
  createMarkupDeclaration,
  createStringDocumentFragment,
  createUnescapedString,
  extractTagNameFromElementBuilder,
  getElementDeclarationFromElementBuilder,
  getElementDeclarationFromViewBuilder,
  isElementBuilder,
  isElementDeclaration,
  isStringDocumentFragment,
  isUnescapedString,
  isViewBuilder,
  nodesToElementBuilderChildren,
  nodeToHtml,
  renderStringsOnlyFragment,
} from "../utils/mod.ts";

// Banned globals
declare const document: never;
declare const window: never;
// Ensure we don't accidentally use `HTMLRewriter` from Bun here (doh) 🙃
declare const HTMLRewriter: never;

/**
 * The default value for the `disableKeyAttributes` option
 * for the `render` function. This should be the fallback
 * value when passing options to the `build` function.
 *
 * @defaultValue false
 */
const DEFAULT_DISABLE_KEY_ATTRIBUTES = false;

const DEFAULT_ENABLE_WHITESPACE = false;

/**
 * The default value for the `reactiveElementTimeout` option.
 */
const DEFAULT_REACTIVE_ELEMENT_TIMEOUT =
  0 satisfies RenderOptions["reactiveElementTimeout"];

export type RenderOptions = SharedOptions & {
  /**
   * If true, will enable rendering whitespace between elements and attributes.
   *
   * @defaultValue false
   */
  enableWhitespace?: boolean;
  /**
   * Determines whether rendering should wait for reactive elements to complete updates.
   * The maximum time to wait for __each__ reactive element to complete updates.
   *
   * @defaultValue `0` A maximum of 0 milliseconds, meaning rendering will wait for however-many
   * microtasks within the current millisecond to complete updates.
   *
   * @remarks
   *
   * - If set to `false`, rendering will not wait for reactive elements to complete updates.
   * - If set to `null`, rendering will wait indefinitely for reactive elements to complete updates.
   * - If set to a number, rendering will wait a maximum of the specified number of milliseconds for
   *   a reactive elements to complete updates. If the timeout is reached, the returned promise will
   *   be rejected with an `Error`.
   *
   * Elements should implement the `ReactiveControllerHost["updateComplete"]`property to support this.
   */
  reactiveElementTimeout?: number | false | null;
  /**
   * Disables the rendering of declarative shadow roots.
   *
   * @remarks
   *
   * If set to `true`, shadow roots will NOT be rendered as declarative shadow roots.
   *
   * When enabled, the `renderToString` method of elements is still preferred. If not present,
   * and the element's shadow DOM is open, it will be rendered as a declarative shadow root.
   * If the shadow root is closed, no declarative shadow DOM will be rendered.
   *
   * To render an element with a closed shadow root, implement the `renderToString` method
   * as described in the `ElementWithRenderToString` interface.
   *
   * @see ElementWithRenderToString
   *
   * @defaultValue false
   */
  disableShadowDOMRendering?: boolean;
  /**
   * If true, will disable recognition of `renderToString` methods
   * on elements.
   */
  disableRenderToString?: boolean;
};

/**
 * Void elements are elements that cannot have children.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Glossary/Void_element | MDN Reference}
 */
enum VoidElement {
  Area = "area",
  Base = "base",
  Br = "br",
  Col = "col",
  Embed = "embed",
  Hr = "hr",
  Img = "img",
  Input = "input",
  Link = "link",
  Meta = "meta",
  Source = "source",
  Track = "track",
  Wbr = "wbr",
}

const VOID_ELEMENTS: string[] = Object.values(VoidElement);

async function renderChildren(
  children: readonly ElementBuilder.Child[],
  options: RenderOptions,
): Promise<string> {
  const { enableWhitespace = false } = options;
  const whitespace = enableWhitespace ? "\n" : "";

  return (
    await Promise.all(
      children.map((child) => renderChildToString(child, options)),
    )
  ).join(whitespace);
}

async function renderChildToString(
  child: ElementBuilder.Child,
  options: RenderOptions,
): Promise<string> {
  if (typeof child === "string" || typeof child === "number") {
    return escapeHtml(String(child));
  }
  if (isElement(child)) {
    return renderElement(child, options);
  }
  if (isDocumentFragment(child)) {
    return renderDocumentFragment(child, options);
  }
  if (isStringDocumentFragment(child)) {
    return renderStringDocumentFragment(child, options);
  }

  return render(child, options);
}

async function renderDocumentFragment(
  fragment: DocumentFragment,
  options: RenderOptions,
): Promise<string> {
  return childNodesToString(fragment.childNodes, options);
}

/**
 * An interface that allows for rendering an element to a string.
 *
 * @remarks
 *
 * This interface allows for the renderer to delegate the rendering
 * of an element to the element itself, which can be useful for
 * elements to render their closed shadow root as a declarative
 * shadow root.
 *
 * @public
 */
// TODO: Rename for clarity
export type ElementWithRenderToString = Element & {
  /**
   * Renders the element to a string where the element's shadow DOM is
   * rendered as a declarative shadow DOM.
   */
  renderToString: (
    childrenString: string,
    // TODO: Consider making this a more generic type like `Record<string, unknown>`
    options?: RenderOptions,
  ) => string | Promise<string>;
};

function isElementWithRenderToString(
  element: Element,
): element is ElementWithRenderToString {
  return (
    typeof (element as ElementWithRenderToString).renderToString === "function"
  );
}

async function domElementBuilderToString(
  elementBuilder: ElementBuilder<
    AnyProps,
    SingularElement | DocumentFragment,
    "dom"
  >,
  options: RenderOptions,
): Promise<string> {
  const $document = options.document ?? globalThis.document;
  const nextOptions = { ...options, document: $document };
  const tagName = extractTagNameFromElementBuilder(elementBuilder);

  if (!options.disableShadowDOMRendering) {
    syncCustomElementRegistries(
      tagName,
      globalThis.customElements,
      $document.defaultView?.customElements,
    );
  }

  const sharedOptions: OptionalAndComplete<SharedOptions> = {
    document: $document,
    logger: options.logger,
    disableKeyAttributes:
      options.disableKeyAttributes ?? DEFAULT_DISABLE_KEY_ATTRIBUTES,
  };

  // TODO: Considering pulling out children and rendering them separately
  // from the containing element. This could avoid unnecessary conversions
  // from strings to elements and back to strings.
  const el = await build(elementBuilder, sharedOptions);

  // If for some reason the builder returns `null`, we return
  // an empty string. This shouldn't happen, but it's a good
  // safety check.
  if (el === null) return "";

  if (isElement(el)) {
    return renderElement(el, nextOptions);
  }

  return nodeToHtml($document, el);
}

async function renderElement(
  el: Element,
  options: RenderOptions,
): Promise<string> {
  const $document = options.document ?? globalThis.document;
  const nextOptions = { ...options, document: $document };

  const reactiveElementTimeout =
    options.reactiveElementTimeout !== undefined
      ? options.reactiveElementTimeout
      : DEFAULT_REACTIVE_ELEMENT_TIMEOUT;

  if (reactiveElementTimeout !== false && isUpdatableHost(el)) {
    await uponElementUpdatesSettled(el, reactiveElementTimeout);
  }

  // Each child is rendered to a string, with each being processed by `render()`
  const childNodesString = await childNodesToString(el.childNodes, nextOptions);

  // If the element has a `renderToString` method, we call it
  // to render the element's shadow DOM.
  if (!options.disableRenderToString && isElementWithRenderToString(el)) {
    return el.renderToString(childNodesString, nextOptions);
  }

  // Otherwise, we clone the element as a declaration without its children,
  // and set the `childNodesString` as the inner HTML of the declaration.
  //
  // The strategy here is to avoids:
  // 1. Converting the children from HTML to DOM and back to HTML.
  // 2. Gives us the opportunity to render a declarative shadow DOM,
  // by not converting the HTML into DOM.

  // ---

  // NOTE: Only the element's attributes are relevant here.
  // Properties, event listeners, and similar runtime data are not
  // represented in HTML, so they do not need to be serialized at this stage.
  //
  // If an element requires certain properties to be serialized,
  // it should implement its own serialization and rehydration logic.
  //
  // For `KnytElement` instances, use `hydrateProp` or `hydrateRef`
  // to handle serialization and rehydration of properties without
  // exposing them as attributes.
  //
  // This approach mirrors the behavior of the `cloneNode` method.
  // `cloneNode` copies only the element's attributes and children,
  // excluding properties, event listeners, and other runtime data.
  // Its purpose is to duplicate the element's structure,
  // not its runtime state.
  const attributes: ElementDeclaration.Attributes = {};

  for (const name of el.getAttributeNames()) {
    // NOTE: We won't try to interpret the attribute value here;
    // we will simply copy it as a string.
    //
    // We don't want to make assumptions about the attribute value.
    // For example, boolean attributes may be interpreted as both an
    // empty string value or `true`.
    //
    // See: https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML
    attributes[name] = el.getAttribute(name);
  }

  const openShadowRoot =
    el.shadowRoot && !options.disableShadowDOMRendering
      ? await renderOpenShadowRoot(el.shadowRoot, nextOptions)
      : null;
  const tagName = el.tagName.toLowerCase();
  const cloneDeclaration = createMarkupDeclaration(tagName, attributes, [
    openShadowRoot,
    createStringDocumentFragment.fromString(childNodesString),
  ]);

  return render(cloneDeclaration, nextOptions);
}

// Locally reference the `JSON.stringify` function
// to avoid some potential issues with global overrides.
const jsonStringify = JSON.stringify;

function renderAttribute(name: string, value: string): string;

function renderAttribute(
  name: string,
  value: AttributeValue,
): string | undefined;

function renderAttribute(
  name: string,
  value: AttributeValue,
): string | undefined {
  const sanitizedName = sanitizeAttributeName(name);

  if (value == null) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value ? sanitizedName : undefined;
  }
  if (typeof value === "string" || typeof value === "number") {
    return `${sanitizedName}="${escapeAttributeValue(String(value))}"`;
  }
  if (typeof value === "object") {
    return `${sanitizedName}="${escapeAttributeValue(jsonStringify(value))}"`;
  }

  typeCheck<never>(typeCheck.identify(value));

  throw new TypeError(
    `Invalid attribute value type: ${typeof value}. Expected string, boolean, or object.`,
  );
}

/**
 * @internal scope: package
 */
export function renderAttributes(attributes: AttributeDictionary): string[] {
  const renderedAttributes: string[] = [];

  for (const [name, value] of Object.entries(attributes)) {
    const render = renderAttribute(name, value);

    if (render) {
      renderedAttributes.push(render);
    }
  }

  return renderedAttributes;
}

/**
 * Renders the given declaration into an HTML string
 *
 * @example
 *
 * ```ts
 * import { render, html } from "knyt";
 *
 * const htmlString = await render(html.div);
 * ```
 */
export async function render(
  input: KnytDeclaration | string | null | false | undefined | Element,
  options: RenderOptions = {},
): Promise<string> {
  const $document = options.document ?? globalThis.document;
  const {
    disableKeyAttributes = DEFAULT_DISABLE_KEY_ATTRIBUTES,
    enableWhitespace = DEFAULT_ENABLE_WHITESPACE,
  } = options;

  let declaration: ElementDeclaration.Input;

  if (input == null || input === false) {
    return "";
  }
  if (typeof input === "string") {
    return escapeHtml(input);
  }
  if (isElementBuilder(input)) {
    if (isElementBuilder.Fragment(input) || isElementBuilder.Markup(input)) {
      declaration = getElementDeclarationFromElementBuilder(input);
    } else if (isElementBuilder.DOM(input)) {
      return domElementBuilderToString(input, options);
    } else {
      throw new Error("Unknown element kind");
    }
  } else if (isViewBuilder(input)) {
    declaration = await getElementDeclarationFromViewBuilder(input);
  } else if (isElementDeclaration(input)) {
    declaration = input;
  } else if (isElement(input)) {
    // To avoid more complexity, we will simply convert the element into a declaration.
    declaration = createFragmentDeclaration([input]);
  } else {
    throw new TypeError(
      `Invalid input type: ${typeof input}. Input must be of type \`KnytDeclaration\`.`,
    );
  }

  if (isElementDeclaration.Fragment(declaration)) {
    // To clarify, we don't need to check with `shouldRecognizeChildren` here,
    // because the `children` property is always recognized in a fragment.
    // This is because fragment's can't have a render mode.
    return renderChildren(declaration.children, options);
  }

  const { type, props, children, key, attributes } =
    // Declarations for DOM elements and Fragments are handled above,
    // so this declaration must be an Markup declaration for a singular element.
    declaration as ElementDeclaration<
      ElementDeclaration.MarkupProps,
      SingularElement
    >;

  if (typeof type === "string") {
    const tagName: string = type;

    const { style, ...attributesFromProps } = props;
    const allAttributes = {
      ...attributesFromProps,
      // NOTE:`attributes` takes precedence over `props`,
      // because there are only special cases where `attributes` is
      // set in a markup element builder.
      // Currently, the only case where it's used in for htmx attributes.
      ...attributes,
    };
    const innerHtml = shouldRecognizeChildren(declaration, undefined)
      ? await renderChildren(children, options)
      : "";
    const renderedAttributes = renderAttributes(allAttributes);

    if (style) {
      const css =
        typeof style === "string" ? style : renderCSS($document, style);

      renderedAttributes.push(renderAttribute("style", css));
    }
    if (key && !disableKeyAttributes) {
      renderedAttributes.push(renderAttribute(KEY_ATTRIBUTE, key));
    }

    const whitespace = enableWhitespace ? "\n" : "";

    const attrsStr = renderedAttributes.length
      ? `${whitespace} ${renderedAttributes.join(`${whitespace} `)}${whitespace}`
      : "";

    if (innerHtml === "" && VOID_ELEMENTS.includes(tagName)) {
      return `<${tagName}${attrsStr}>`;
    }

    return `<${tagName}${attrsStr}>${whitespace}${innerHtml}${whitespace}</${tagName}>`;
  }

  return "";
}

export namespace render {
  /**
   * Calls the `render` function and prefixes the result with `<!doctype html>`.
   *
   * @see render
   * @public
   */
  export async function withDocType(
    ...args: Parameters<typeof render>
  ): Promise<string> {
    return `<!doctype html>${await render(...args)}`;
  }
}

async function renderStringDocumentFragment(
  input: StringDocumentFragment,
  options: RenderOptions,
): Promise<string> {
  if (containsOnlyStrings(input)) {
    return renderStringsOnlyFragment(input);
  }

  return renderInterpolatedStringDocumentFragment(input, options);
}

async function renderInterpolatedStringDocumentFragment(
  input: StringDocumentFragment,
  options: RenderOptions,
): Promise<string> {
  const { markup, values } = input;
  const renderedValues = await Promise.all(
    values.map(async (value) => {
      if (isUnescapedString(value)) {
        return value;
      }

      return createUnescapedString(
        await render(createFragmentDeclaration([value]), options),
      );
    }),
  );

  return renderStringsOnlyFragment(
    createStringDocumentFragment(markup, renderedValues),
  );
}

function childNodesToString(
  childNodes: NodeListOf<ChildNode>,
  options: RenderOptions,
): Promise<string> {
  return render(
    createFragmentDeclaration(nodesToElementBuilderChildren(childNodes)),
    options,
  );
}

async function renderOpenShadowRoot(
  shadowRoot: ShadowRoot,
  options: RenderOptions,
): Promise<StringDocumentFragment.WithStringsOnly> {
  const childNodesString = await childNodesToString(
    shadowRoot.childNodes,
    options,
  );
  const childNodesFragment =
    createStringDocumentFragment.fromString(childNodesString);
  const templateDeclaration = createMarkupDeclaration(
    "template",
    { shadowrootmode: "open" },
    [childNodesFragment],
  );
  const templateString = await render(templateDeclaration, options);

  return createStringDocumentFragment.fromString(templateString);
}
