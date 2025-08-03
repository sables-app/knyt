import {
  createDOMBuilder,
  createHTMLBuilder,
  RenderMode,
  type AnyProps,
  type ElementBuilder,
  type HTMLElementTagName,
} from "@knyt/weaver";

import type { KnytElement } from "../KnytElement";
import type { ElementDefinition } from "../types";

// Banned globals
declare const customElements: never;
declare const document: never;
declare const window: never;

/**
 * @internal scope: workspace
 */
export type DefineElementDefinitionOptions = {
  /**
   * Determines the default render mode of the element's declaration.
   *
   * @see {@link https://knyt.dev/guide/render-modes}
   */
  defaultRenderMode?: `${RenderMode}`;
  /**
   * The custom element registry to use for defining the custom element.
   *
   * @remarks
   *
   * This is useful for defining elements within a specific window.
   */
  customElements?: Window["customElements"];
};

/**
 * Defines a new custom element with the given name and constructor.
 *
 * @param tagName The name of the custom element.
 * @param ElementConstructor The constructor of the custom element.
 * @returns A set of builders for rendering the custom element.
 *
 * @internal scope: package
 */
export function defineElementDefinition<
  T extends KnytElement.Constructor.Any,
  // TODO: Should this just be `string` instead?
  U extends HTMLElementTagName.Input,
  P extends AnyProps = InstanceType<T>,
  A extends AnyProps = KnytElement.ToAttributes<T>,
>(
  tagName: U,
  ElementConstructor: T,
  options: DefineElementDefinitionOptions = {},
): ElementDefinition<T, U, P, A> {
  const $customElements = options.customElements ?? globalThis.customElements;

  if (
    // If HMR is enabled, we need to redefine the element
    // to ensure the latest version is used.
    // The HMR system _should_ polyfill the `customElements` registry
    // to ensure that the element can be redefined.
    import.meta.hot ||
    // Otherwise, we only define the element if it hasn't been defined yet.
    // This is to prevent errors when the element is defined multiple times.
    !$customElements.get(tagName)
  ) {
    try {
      $customElements.define(tagName, ElementConstructor);
    } catch (error) {
      console.error(error);
    }
  }

  const domBuilder = createDOMBuilder<P>(tagName);
  const htmlBuilder = createHTMLBuilder<A>(tagName);

  const def = () => configureElementBuilder(domBuilder, options)();

  def.html = () => configureElementBuilder(htmlBuilder, options)();
  def.Element = ElementConstructor;
  def.tagName = tagName;
  def.__isKnytElementDefinition = true as const;

  return def;
}

function configureElementBuilder<T extends ElementBuilder>(
  builder: T,
  options: DefineElementDefinitionOptions,
): () => T {
  const defaultRenderMode = options.defaultRenderMode;

  return () => {
    if (defaultRenderMode) {
      return builder.$renderMode(defaultRenderMode) as T;
    }

    return builder;
  };
}
