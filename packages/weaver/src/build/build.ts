import {
  escapeHtml,
  isElement,
  isNode,
  isUnknownDictionary,
  typeCheck,
} from "@knyt/artisan";

import { appendAllChildren } from "../appendAllChildren";
import { KEY_ATTRIBUTE } from "../constants";
import { setSingularElementAttributes } from "../setSingularElementAttributes";
import { setSingularElementDataset } from "../setSingularElementDataset";
import { setSingularElementProperties } from "../setSingularElementProperties";
import {
  isNonNullableStyleInput,
  setSingularElementStyle,
} from "../setSingularElementStyle";
import { shouldRecognizeChildren } from "../shouldRecognizeChildren";
import type {
  AttributeDictionary,
  DatasetObject,
  ElementBuilder,
  ElementDeclaration,
  KnytDeclaration,
  KnytNode,
  SharedOptions,
  SingularElement,
  StringDocumentFragment,
} from "../types/mod";
import {
  createFragmentDeclaration,
  getElementDeclarationFromElementBuilder,
  getElementDeclarationFromViewBuilder,
  isElementBuilder,
  isElementDeclaration,
  isStringDocumentFragment,
  isUnescapedString,
  isViewBuilder,
  normalizeElementDeclarationRef,
} from "../utils/mod";
import { addListenersToElement } from "./addListenersToElement";
import { createElementFromDeclaration } from "./createElementFromDeclaration";

// Banned globals
declare const document: never;
declare const window: never;

/**
 * The default value for the `disableKeyAttributes` option
 * for the `build` function. This should be the fallback
 * value when receiving options.
 *
 * @defaultValue true
 */
const DEFAULT_DISABLE_KEY_ATTRIBUTES = true;

/**
 * The result of the `build` function.
 *
 * Either a DOM node produced by the renderer, or `null` if the input
 * was not a valid element declaration or builder.
 *
 * @beta
 */
/*
 * ### Private Remarks
 *
 * The renderer doesn't accepts strings to render `Text` nodes.
 * To render text, one would render a fragment with a string as a child.
 * Then the renderer would return a `DocumentFragment` with a `Text` node.
 *
 * This is design decision so the renderer can focus on Elements and Fragments;
 * not interested in rendering Nodes like comments, etc.
 */
// prettier-ignore
export type BuildResult<T extends SingularElement | DocumentFragment | null> =
  T extends SingularElement ? SingularElement.WithDeclaration<T> :
  T extends Node ? DocumentFragment :
  null;

/**
 * A simple, generic-free type that represents the
 * output of the `build` function.
 *
 * @internal scope: package
 */
type BuildOutput = SingularElement | DocumentFragment | null;

type BuildOptions = SharedOptions;

async function buildAndAppendChildren(
  parent: SingularElement | DocumentFragment,
  children: readonly ElementBuilder.Child[],
  options: BuildOptions,
): Promise<void> {
  const logger = options.logger ?? {};

  logger.debug?.("[buildChildren]");

  const timeId = `build-and-append-children-${Math.random().toString(16).slice(2)}`;
  logger.time?.(timeId);

  appendAllChildren(
    parent,
    await Promise.all(
      children.map((child) => buildElementBuilderChild(child, options)),
    ),
  );

  logger.timeEnd?.(timeId);
}

function buildElementBuilderChild(
  child: ElementBuilder.Child,
  options: BuildOptions,
) {
  const $document = options.document ?? globalThis.document;
  const logger = options.logger ?? {};

  logger.debug?.("[buildChildren] child");

  if (isNode(child)) {
    logger.debug?.("[buildChildren] Node instance");
    return child;
  }
  if (typeof child === "string" || typeof child === "number") {
    logger.debug?.("[buildChildren] string or number");

    // NOTE: Creating a text node effectively escapes the string and prevents XSS attacks.
    return $document.createTextNode(String(child));
  }
  if (child == null || child === false) {
    logger.debug?.("[buildChildren] undefined, null, or false");

    return null;
  }
  if (isStringDocumentFragment(child)) {
    logger.debug?.("[buildChildren] string document fragment");

    return templateStringsToDocumentFragment(
      $document,
      child.markup,
      child.values,
    );
  }

  logger.debug?.("[buildChildren] other");

  return build(child, options) as Promise<BuildOutput>;
}

/**
 * Construct elements from a given declaration
 *
 * @example
 *
 * ```ts
 * import { build, dom } from "knyt";
 *
 * const div = await build(dom.div);
 * ```
 */
export async function build<
  T extends KnytDeclaration.ToNode<U>,
  U extends KnytDeclaration = KnytDeclaration,
>(input: U, options: BuildOptions = {}): Promise<BuildResult<T>> {
  const $document = options.document ?? globalThis.document;
  const disableKeyAttributes =
    options.disableKeyAttributes ?? DEFAULT_DISABLE_KEY_ATTRIBUTES;
  const logger = options.logger ?? {};

  logger.debug?.("[build]");
  let declaration: ElementDeclaration.Input;

  if (isElementBuilder(input)) {
    logger.debug?.("[build] element builder");

    if (isElementBuilder.Valid(input)) {
      declaration = getElementDeclarationFromElementBuilder(input);
    } else {
      throw new Error("Unknown element kind");
    }
  } else if (isViewBuilder(input)) {
    logger.debug?.("[build] view builder");

    declaration = await getElementDeclarationFromViewBuilder(input);
  } else if (isElementDeclaration(input)) {
    logger.debug?.("[build] element");

    declaration = input;
  } else {
    logger.debug?.("[build] unknown");
    throw new TypeError("Unknown input kind");
  }

  logger.debug?.("[build] basic element");

  const { type, props, children, ref, listeners, attributes, key } =
    declaration as ElementDeclaration.Internal;

  if (isElementDeclaration.Fragment(declaration)) {
    logger.debug?.("[build] fragment");

    const fragment = $document.createDocumentFragment();

    // To clarify, we don't need to check with `shouldRecognizeChildren` here,
    // because the `children` property is always recognized in a fragment.
    // This is because fragment's can't have a render mode.
    await buildAndAppendChildren(fragment, children, options);

    logger.debug?.("[build] fragment and returning");

    // Always return a fragment for fragment declarations.
    // This ensures consistent output, even if the fragment has a single child.
    // Consistency simplifies interfacing with the output.
    return fragment as BuildResult<T>;
  }

  if (typeof type === "string") {
    logger.debug?.(`[build] string (${type})`);

    const element = createElementFromDeclaration($document, declaration);

    logger.debug?.(`[build] string (${type}) after element is created`);

    // Should be called before setting props
    normalizeElementDeclarationRef(ref)?.next(element);

    if (key && !disableKeyAttributes) {
      element.setAttribute(KEY_ATTRIBUTE, key);
    }

    if (isElementDeclaration.Markup(declaration)) {
      // If the declaration is a markup declaration, then props are set as attributes

      const { dataset, style, ...otherProps } = props;

      {
        const nextAttributes: AttributeDictionary = {
          ...otherProps,
          // `attributes` take precedence over `props`
          ...attributes,
        };

        setSingularElementAttributes(element, {}, nextAttributes);
      }

      if (isNonNullableStyleInput(style)) {
        // Use `setSingularElementStyle` for setting styles directly,
        // as it is more efficient than rendering a CSS string and invoking
        // the CSS parser via the `style` attribute.
        setSingularElementStyle(element, undefined, style);
      }

      if (isUnknownDictionary(dataset)) {
        // Use `setSingularElementDataset` for setting dataset attributes
        // as it is more efficient than rendering each dataset attribute
        // name and value.
        setSingularElementDataset(element, undefined, dataset as DatasetObject);
      }
    } else {
      // Otherwise props are set as properties

      const { dataset, style, ...otherProps } = props;

      setSingularElementProperties(element, {}, otherProps);

      if (isNonNullableStyleInput(style)) {
        setSingularElementStyle(element, {}, style);
      }
      if (isUnknownDictionary(dataset)) {
        setSingularElementDataset(element, {}, dataset as DatasetObject);
      }

      // Set attributes second if they exist,
      // because `attributes` take precedence over `props`
      if (attributes) {
        setSingularElementAttributes(element, {}, attributes);
      }
    }

    if (listeners) {
      addListenersToElement(element, listeners);
    }

    if (shouldRecognizeChildren(declaration, element)) {
      await buildAndAppendChildren(element, children, options);
    }

    return element as BuildResult<T>;
  }

  // This shouldn't happen.
  // TODO: Consider throwing an error here instead of returning null.
  // TODO: Log an error message in development mode.
  return null as BuildResult<T>;
}

async function templateStringsToDocumentFragment(
  $document: Document,
  markup: TemplateStringsArray,
  values: StringDocumentFragment.Value[],
): Promise<DocumentFragment> {
  type ReplacementId = string;

  const replacements = new Map<ReplacementId, KnytNode>();

  let html = "";

  for (let i = 0; i < markup.length; i++) {
    html += markup[i];

    if (i < values.length) {
      const value = values[i];

      if (value == null || value === false) {
        // Skip null, undefined, and false values
        continue;
      }
      if (isUnescapedString(value)) {
        html += String(value);
        continue;
      }
      if (typeof value === "string" || typeof value === "number") {
        html += escapeHtml(String(value));
        continue;
      }

      typeCheck<KnytNode>(typeCheck.identify(value));

      const id: ReplacementId = String(i);

      replacements.set(id, value);

      html += `<knyt-replace id="${id}"></knyt-replace>`;
    }
  }

  const templateEl = $document.createElement("template");

  templateEl.innerHTML = html;

  const placeholderElements = Array.from(
    templateEl.content.querySelectorAll("knyt-replace"),
  );

  const builtReplacements = new Map<ReplacementId, Node>(
    await Promise.all(
      replacements.entries().map(async ([id, replacement]) => {
        if (isElement(replacement)) {
          return [id, replacement] as const;
        }

        const fragmentToInsert = await build<DocumentFragment>(
          createFragmentDeclaration([replacement]),
        );

        if (fragmentToInsert == null) {
          // This should never happen, but just in case
          throw new Error("Fragment to insert is null");
        }

        return [id, fragmentToInsert] as const;
      }),
    ),
  );

  for (const placeholderElement of placeholderElements) {
    const id = placeholderElement.getAttribute("id");

    if (id == null) {
      throw new Error("Missing id attribute on knyt-replace element");
    }

    const builtReplacement = builtReplacements.get(id);

    if (builtReplacement == null) {
      throw new Error(`No replacement found for id: ${id}`);
    }

    placeholderElement.replaceWith(builtReplacement);
  }

  return templateEl.content;
}
