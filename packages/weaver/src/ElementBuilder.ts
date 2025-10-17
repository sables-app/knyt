import {
  ElementBuilderDomHTMLSymbol,
  ElementBuilderDomSVGSymbol,
  ElementBuilderIsElementSymbol,
  ElementBuilderKindSymbol,
  ElementBuilderMarkupHTMLSymbol,
  ElementBuilderMarkupSVGSymbol,
  ElementBuilderTargetSymbol,
  ElementDeclarationKindBySymbol,
  FragmentTypeSymbol,
} from "./constants.ts";
import { cx } from "./cx.ts";
import { hx, isHtmxAttributeName } from "./Htmx.ts";
import { markupTemplateTag } from "./markupTemplateTag.ts";
import type {
  AnyProps,
  AttributeDictionary,
  DOMBuilder,
  ElementBuilder,
  ElementBuilderEventListenerParams,
  ElementBuilderFactory,
  ElementBuilderKind,
  ElementDeclaration,
  ElementDeclarationListeners,
  ElementType,
  HandoffToElementBuilderFn,
  HTMLElementTagName,
  HTMLGlobalAttributes,
  HTMLRenderer,
  StringDocumentFragment,
  SVGBuilder,
  SVGRenderer,
  UnknownProps,
} from "./types/mod.ts";
import {
  cloneElementDeclaration,
  createEmptyElementDeclaration,
  createListenerDeclarationKey,
  createStringDocumentFragment,
  getElementDeclarationFromElementBuilder,
  getMutableElementDeclarationFromElementBuilder,
  isElementBuilderChildren,
  isElementDeclaration,
  isElementDeclarationAttributesInput,
  isElementDeclarationKeyInput,
  isElementDeclarationKindDom,
  isElementDeclarationPropsInput,
  isElementDeclarationRefInput,
  isListenerDeclaration,
  isRenderMode,
} from "./utils/mod.ts";

const FRAGMENT_PROP_NAME = "fragment";

enum SpecialProperties {
  EventListener = "$on",
  Key = "$key",
  Children = "$children",
  ChildrenShorthand = "$",
  InnerHTML = "$innerHTML",
  Props = "$props",
  Attrs = "$attrs",
  Ref = "$ref",
  RenderMode = "$renderMode",
  HtmxAttribute = "$hx",
  ClassNames = "$cx",
  /**
   * A blocked property to prevent the proxy from being
   * resolved like a promise.
   *
   * @remarks
   *
   * This is used to prevent the proxy being recognized
   * as a `PromiseLike` object, which would cause the `then`
   * method to be called, and the resulting "promise" is
   * never resolved.
   */
  Then = "then",
}

function createElementBuilderFactory<
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
  Q extends "dom" | "markup" = "dom" | "markup",
>(kindSymbol: ElementBuilderKind): ElementBuilderFactory<P, E, Q> {
  const kind = ElementDeclarationKindBySymbol[kindSymbol];

  function elementBuilderFactory(
    input: ElementType | ElementDeclaration<P, E>,
  ): ElementBuilder<P, E, Q> {
    let target: ElementDeclaration<P, E>;

    if (isElementDeclaration<ElementDeclaration<P, E>>(input)) {
      target = cloneElementDeclaration<P, E>(input);
    } else {
      target = createEmptyElementDeclaration<P, E>(input, kind);
    }

    /**
     * Handoff the element declaration to the next element builder.
     *
     * @remarks
     *
     * This function is used to safely mutate the element declaration object,
     * before returning the next element builder.
     *
     * A new element builder is created with the same target element declaration,
     * and the requested changes are applied to the element declaration object.
     * The next element builder is then returned.
     *
     * @param mutateElementDeclaration - A function that mutates the element declaration object.
     * @returns The next element builder.
     */
    // TODO: Rename to `updateElementDeclaration` for clarity.
    const handoffToElementBuilder: HandoffToElementBuilderFn<P, E> =
      function handoffToElementBuilder(mutateElementDeclaration) {
        /**
         * This is the next element builder that will be returned.
         */
        const nextElementBuilder = elementBuilderFactory(target);
        /**
         * This is the next element declaration from the next element builder.
         * This object can be safely mutated with the requested changes,
         * before returning the next element builder.
         */
        const nextElementDeclaration =
          getElementDeclarationFromElementBuilder(nextElementBuilder);

        mutateElementDeclaration(nextElementDeclaration);

        return nextElementBuilder;
      };

    const elementBuilder = new Proxy(
      {},
      {
        get: (_fakeTarget, propertyName, _receiver) => {
          if (propertyName === ElementBuilderKindSymbol) {
            return kindSymbol;
          }
          if (propertyName === ElementBuilderTargetSymbol) {
            return target;
          }
          if (propertyName === ElementBuilderIsElementSymbol) {
            return true;
          }
          if (propertyName === SpecialProperties.Then) {
            // This is a blocked property to prevent the proxy from being
            // resolved like a promise.
            return undefined;
          }

          return (...args: unknown[]) => {
            if (propertyName === SpecialProperties.EventListener) {
              return addEventListenerToElementDeclaration<P, E>(
                handoffToElementBuilder,
                // Type assertion to avoid unnecessary type checks
                args as any,
              );
            }

            const [value, ...rest] = args;

            /**
             * This is the next element builder that will be returned.
             */
            // TODO: Refactor to use `handoffToElementBuilder` instead.
            const nextElementBuilder = elementBuilderFactory(target);
            /**
             * This is the next element declaration from the next element builder.
             * This object can be safely mutated with the requested changes,
             * before returning the next element builder.
             */
            // TODO: Refactor to use `handoffToElementBuilder` instead.
            const nextElementDeclaration =
              getMutableElementDeclarationFromElementBuilder(
                nextElementBuilder,
              );

            if (
              propertyName === SpecialProperties.Children ||
              propertyName === SpecialProperties.ChildrenShorthand
            ) {
              const firstChild = value == null ? [] : [value];
              const otherChildren = rest as ElementBuilder.Child[];
              const children = [...firstChild, ...otherChildren];

              if (!isElementBuilderChildren(children)) {
                throw new Error("Invalid child type");
              }

              nextElementDeclaration.children = children;
            } else if (propertyName === SpecialProperties.InnerHTML) {
              if (typeof value !== "string") {
                throw new Error("Invalid innerHTML type");
              }

              nextElementDeclaration.children = [
                createStringDocumentFragment.fromString(value),
              ];
            } else if (propertyName === SpecialProperties.RenderMode) {
              if (!isRenderMode(value)) {
                throw new Error("Invalid RenderMode type");
              }

              nextElementDeclaration.renderMode = value;
            } else if (propertyName === SpecialProperties.HtmxAttribute) {
              if (!isHtmxAttributeName(value)) {
                throw new Error(
                  "Unrecognized htmx attribute name. If you are certain this is a valid htmx attribute, you may use the `$attrs` method instead.",
                );
              }

              const attr = hx(value, ...(rest as [any]));

              if (!nextElementDeclaration.attributes) {
                nextElementDeclaration.attributes = {};
              }

              nextElementDeclaration.attributes[attr.name] = attr.value;
            } else if (propertyName === SpecialProperties.ClassNames) {
              const firstArg = value == null ? [] : [value];
              const args = [...firstArg, ...rest];
              const elementPropName = isElementDeclarationKindDom(kind)
                ? "className"
                : "class";

              (nextElementDeclaration.props as UnknownProps)[elementPropName] =
                cx(args);
            } else if (propertyName === SpecialProperties.Ref) {
              if (!isElementDeclarationRefInput<E>(value)) {
                throw new Error("Invalid ref type");
              }

              nextElementDeclaration.ref = value;
            } else if (propertyName === SpecialProperties.Key) {
              if (!isElementDeclarationKeyInput(value)) {
                throw new Error(`Invalid key type: ${typeof value}`);
              }

              nextElementDeclaration.key = value;
            } else if (propertyName === SpecialProperties.Props) {
              if (!isElementDeclarationPropsInput(value)) {
                throw new Error(`Invalid props value type: ${typeof value}`);
              }

              Object.assign(nextElementDeclaration.props, value);
            } else if (propertyName === SpecialProperties.Attrs) {
              // The behavior of this method changes based on the kind of element builder.
              // If the element builder is a DOM element, the dictionary is set as `attributes`,
              // otherwise, it's set as `props`.

              if (isElementDeclarationKindDom(kind)) {
                if (!isElementDeclarationAttributesInput(value)) {
                  throw new Error(`Invalid attrs value type: ${typeof value}`);
                }

                if (!nextElementDeclaration.attributes) {
                  nextElementDeclaration.attributes = {};
                }

                Object.assign(nextElementDeclaration.attributes, value);
              } else {
                if (!isElementDeclarationPropsInput(value)) {
                  throw new Error(`Invalid props value type: ${typeof value}`);
                }

                Object.assign(nextElementDeclaration.props, value);
              }
            } else {
              (nextElementDeclaration.props as UnknownProps)[propertyName] =
                value;
            }

            return nextElementBuilder;
          };
        },
      },
    );

    // Type assertion is needed because of the Proxy
    return elementBuilder as unknown as ElementBuilder<P, E, Q>;
  }

  return elementBuilderFactory;
}

function createElementBuilderProxy(
  kind: typeof ElementBuilderDomHTMLSymbol,
): DOMBuilder;
/** @deprecated SVG is only supported in the `Markup` builder. */
function createElementBuilderProxy(
  kind: typeof ElementBuilderDomSVGSymbol,
): SVGBuilder;
function createElementBuilderProxy(
  kind: typeof ElementBuilderMarkupHTMLSymbol,
): HTMLRenderer;
function createElementBuilderProxy(
  kind: typeof ElementBuilderMarkupSVGSymbol,
): SVGRenderer;
function createElementBuilderProxy(kind: ElementBuilderKind): any {
  return new Proxy(createElementBuilderFactory, {
    apply: (_target, _thisArg, args) => {
      if (
        kind === ElementBuilderMarkupHTMLSymbol ||
        kind === ElementBuilderMarkupSVGSymbol
      ) {
        const [strings, ...values] = args as [
          TemplateStringsArray,
          ...StringDocumentFragment.Value[],
        ];

        return markupTemplateTag(strings, ...values);
      }

      throw new Error(
        "This function is not supported for this kind of element builder.",
      );
    },
    get: (_target, propertyName, _receiver) => {
      if (propertyName === ElementBuilderKindSymbol) {
        return kind;
      }
      if (propertyName === ElementBuilderIsElementSymbol) {
        return false;
      }
      if (propertyName === FRAGMENT_PROP_NAME) {
        return createElementBuilderFactory(kind)(FragmentTypeSymbol);
      }

      const elementTagName = propertyName as any;

      return createElementBuilderFactory(kind)(elementTagName);
    },
  });
}

/**
 * Adds an event listener to an element declaration.
 */
function addEventListenerToElementDeclaration<
  P extends AnyProps,
  E extends AnyProps,
>(
  updateElementDeclaration: HandoffToElementBuilderFn<P, E>,
  args: ElementBuilderEventListenerParams<E>,
): ElementBuilder<P, E> {
  const [type, handler, options] = args;

  let listeners: ElementDeclarationListeners<E>;

  if (isListenerDeclaration(type)) {
    listeners = {
      [createListenerDeclarationKey(type)]: type,
    };
  } else if (typeof type === "object" && "type" in type === false) {
    listeners = type;
  } else if (
    typeof type === "string" &&
    // Beyond strict type safety, this check is necessary to support
    // the case where `handler` is `undefined` due to an optional
    // handler not being provided.
    handler
  ) {
    const listenerDeclaration = { type, handler, options };

    listeners = {
      [createListenerDeclarationKey(listenerDeclaration)]: listenerDeclaration,
    };
  }

  return updateElementDeclaration((elementDeclaration) => {
    elementDeclaration.listeners = Object.assign(
      elementDeclaration.listeners ?? {},
      listeners,
    );
  });
}

/**
 * A builder for DOM element declarations
 *
 * @example
 *
 * ```ts
 * import { dom } from "knyt";
 *
 * dom.button.type("button").$("Click me");
 * ```
 */
export const dom = createElementBuilderProxy(ElementBuilderDomHTMLSymbol);
/**
 * A builder for HTML declarations, offering a fluent API and template tag
 * usage for creating HTML declarations
 *
 * @example
 *
 * ```ts
 * import { html } from "knyt";
 *
 * html.div.class("container").$("Hello, World!");
 * html`<strong>Hello, World!</strong>`;
 * ```
 */
export const html = createElementBuilderProxy(ElementBuilderMarkupHTMLSymbol);
/**
 * A builder for SVG declarations, offering a fluent API and template tag
 * usage for creating SVG declarations
 *
 * @example
 *
 * ```ts
 * import { svg } from "knyt";
 *
 * svg.circle.cx(50).cy(50).r(40).fill("red");
 * svg`<circle cx="50" cy="50" r="40" fill="red" />`;
 * ```
 */
export const svg = createElementBuilderProxy(ElementBuilderMarkupSVGSymbol);

/**
 * Creates an element builder for a DOM element that sets props as properties.
 *
 * The renderer will use the resulting element builder to create an element
 * with the given tag name, and the given props will be set as properties.
 *
 * @internal scope: workspace
 */
// TODO: Rename for clarity?
export function createDOMBuilder<K extends HTMLElementTagName>(
  tagName: K,
): ElementBuilder.DOM<HTMLElementTagNameMap[K]>;

export function createDOMBuilder<P extends AnyProps = AnyProps>(
  tagName: string,
): ElementBuilder.DOM<P>;

export function createDOMBuilder<P extends AnyProps = AnyProps>(
  tagName: HTMLElementTagName.Input,
): ElementBuilder.DOM<P> {
  return createElementBuilderFactory<P, P, "dom">(ElementBuilderDomHTMLSymbol)(
    tagName,
  );
}

/**
 * Creates an element builder that sets props as attributes.
 *
 * The renderer will use the resulting element builder to create an element
 * with the given tag name, and the given props will be set as attributes.
 *
 * @internal scope: workspace
 */
// TODO: Rename for clarity?
export function createMarkupBuilder<P extends AnyProps = AnyProps>(
  tagName: HTMLElementTagName.Input,
): ElementBuilder.Markup<P> {
  return createElementBuilderFactory<P, P, "markup">(
    ElementBuilderMarkupHTMLSymbol,
  )(tagName);
}

/**
 * Creates an element builder for an HTML element that sets props as attributes.
 *
 * The renderer will use the resulting element builder to create an HTML element
 * with the given tag name, and the given props will be set as attributes.
 *
 * Specifically, this function is used to create an element builder for HTML elements,
 * where `HTMLGlobalAttributes` are included in the props.
 *
 * @internal scope: workspace
 */
export function createHTMLBuilder<
  A extends AttributeDictionary = AttributeDictionary,
>(tagName: HTMLElementTagName.Input): ElementBuilder.HTML<A> {
  return createMarkupBuilder<HTMLGlobalAttributes & A>(tagName);
}

/**
 * Creates an element builder for an unknown HTML element.
 *
 * @internal scope: workspace
 */
// TODO: Rename for conciseness
export function createCustomElementBuilder<P extends AnyProps>(
  unknownTagName: string,
): ElementBuilder.DOM<P> {
  return createDOMBuilder<P>(unknownTagName as any);
}

