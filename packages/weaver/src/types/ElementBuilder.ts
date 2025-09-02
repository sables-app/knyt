import type {
  ElementBuilderIsElementSymbol,
  ElementBuilderKindSymbol,
  ElementBuilderTargetSymbol,
} from "../constants";
import type * as Cx from "../cx";
import type { HxFn } from "../Htmx";
import type { RenderMode, UnescapedString } from "../utils/mod";
import type {
  AnyProps,
  AttributeDictionary,
  DatasetObject,
  ElementBuilderKind,
  ElementDeclaration,
  ElementDeclarationListeners,
  EventFromType,
  EventHandler,
  HTMLAttributesByElementTagName,
  HTMLGlobalAttributes,
  InferElement,
  InferElementProps,
  KnytContent,
  ListenerDeclaration,
  ListenerDeclarationType,
  StyleObject,
} from "./core";
import type { ViewBuilder } from "./ViewBuilder";

export type StringDocumentFragment = {
  readonly __isStringDocumentFragment: true;
  readonly markup: TemplateStringsArray;
  readonly values: StringDocumentFragment.Value[];
};

export namespace StringDocumentFragment {
  export type Value = KnytContent | UnescapedString;
  export type WithStringsOnly = {
    __isStringDocumentFragment: true;
    markup: TemplateStringsArray;
    values: WithStringsOnly.Value[];
  };

  export namespace WithStringsOnly {
    // TODO: Add number as a valid value type.
    export type Value = string | UnescapedString;
  }
}

export namespace ElementBuilder {
  /**
   * This type is used to internally represent a child of an element builder.
   */
  /*
   * ### Private Remarks
   *
   * This type shouldn't have generics,
   * because its parent shouldn't be aware of their children's
   * generic types.
   *
   * @see ElementBuilder.ChildrenInput For the type for child inputs.
   */
  export type Child =
    | ElementDeclaration.Input
    | ElementBuilder.Input
    | ViewBuilder.Input
    | Child.Basic;

  export namespace Child {
    /**
     * The basic types that can be used as children of an element builder.
     */
    export type Basic =
      | Element
      | DocumentFragment
      | StringDocumentFragment
      | string
      | number
      | null
      | undefined
      | false;
  }

  /**
   * This type is used to represent the arguments of the `.$children()` method of an element builder.
   *
   * @see {@link ElementBuilder.Child} For the internal type that represents a child of an element builder.
   *
   * @internal scope: workspace
   */
  /*
   * ### Private Remarks
   *
   * This type avoids two issues:
   *
   * 1. Avoids a TypeScript error from circular references of `ElementBuilder.Child`.
   *    This is a workaround to avoid the error, and shouldn't be used externally.
   * 2. Avoid a TypeScript error from producing a type that's too complex to represent.
   *    Unlike the `ElementBuilder.Child` type, the `ElementDeclaration.Input` and
   *    `ElementBuilder.Input` types can't be used here, because they result in a type
   *    that's too complex to represent.
   */
  export type ChildrenInput = Array<ChildrenInput.Child>;

  export namespace ChildrenInput {
    export type Child =
      | ElementDeclaration
      | ElementBuilder<AnyProps, AnyProps, "dom" | "markup">
      | ViewBuilder<AnyProps, AnyProps>
      | Child.Basic;
  }

  /**
   * This type is used to represent the input of the
   * `style` method of an element builder.
   */
  export type StyleInput = StyleObject | string | undefined;

  export type DatasetInput = DatasetObject | undefined;

  /*
   * ### Private Remarks
   *
   * The type needs to be written this way for TypeScript to
   * accurately infer the type of the element. Otherwise,
   * TypeScript will infer the type as `Element | DocumentFragment`
   * instead of the specific type of the element.
   *
   * It's a bit weird, but that's how TypeScript works.
   */
  // prettier-ignore
  export type ToNode<T> =
    T extends ElementBuilder.DOM<infer P, infer E> ?
      E extends P ? E : E :
    T extends ElementBuilder.Markup<infer P, infer E> ?
      E extends P ? E : E :
    never;

  /**
   * @internal scope: workspace
   */
  export type ElementMutators<
    P extends AnyProps = AnyProps,
    E extends AnyProps = P,
    Q extends "dom" | "markup" = "dom",
  > = {
    [K in keyof P as K extends keyof GlobalEventHandlers ? never : K]-?: (
      value: P[K],
    ) => ElementBuilder<P, E, Q>;
  };

  /**
   * @internal scope: workspace
   */
  export type CommonMutators<
    P extends AnyProps = AnyProps,
    E extends AnyProps = P,
    Q extends "dom" | "markup" = "dom",
  > = {
    /**
     * Attach an event listener to the element using the `addEventListener` API.
     *
     * @remarks
     *
     * Unlike native `on*` property setters (e.g. `.onclick()`), this method
     * uses `addEventListener` and `removeEventListener` to manage event
     * listeners on the element.
     */
    $on: {
      <T extends ListenerDeclarationType = ListenerDeclarationType>(
        ...params: ElementBuilderEventListenerParams<E, T>
      ): ElementBuilder<P, E, Q>;
    };
    /**
     * Adds class names to the element, supporting conditional logic
     * (like the `classnames` utility).
     *
     * @remarks
     *
     * This method wraps the `classnames` library.
     *
     * For DOM builders, class names are added to the `className`
     * property. For markup builders, they are added to the `class`
     * attribute.
     */
    $cx: (...args: Cx.ArgumentArray) => ElementBuilder<P, E, Q>;
    // NOTE: See `HxFn` for the docblock
    $hx: HxFn<ElementBuilder<P, E, Q>>;
    /**
     * Declare the children of a node, allowing for nested elements and text content
     */
    $children: (...children: ChildrenInput) => ElementBuilder<P, E, Q>;
    /**
     * Set raw, unescaped HTML as children on the node.
     * Alternative to the native `innerHTML` property, usable with fragments.
     *
     * @example
     * ```ts
     * dom.fragment.$innerHTML("<div>Hello</div>");
     * ```
     *
     * @remarks
     * The HTML string is parsed and inserted as a `DocumentFragment`.
     * The fragment's contents replace any existing children.
     *
     * WARNING: Input must be sanitized to prevent XSS.
     * Use only with trusted content.
     */
    $innerHTML: (html: string) => ElementBuilder<P, E, Q>;
    /**
     * Set the render mode of the element.
     *
     * @see {@link https://knyt.dev/s/render-modes}
     */
    $renderMode: (renderMode: `${RenderMode}`) => ElementBuilder<P, E, Q>;
    /**
     * A shorthand for `$children`.
     *
     * @see ElementBuilder.$children
     */
    $: (...children: ChildrenInput) => ElementBuilder<P, E, Q>;
    /*
     * ### Private Remarks
     *
     * This is overridden so that it can accept both a style string
     * or a style object.
     */
    style: (style: ElementBuilder.StyleInput) => ElementBuilder<P, E, Q>;
    /**
     * @deprecated Use `$children` instead.
     */
    children: never;
    /**
     * @deprecated Setting `outerHTML` is not supported in the renderer.
     */
    outerHTML: never;
    /**
     * @deprecated Setting `outerText` is not supported in the renderer.
     */
    outerText: never;
    /**
     * This is a blocked property to prevent the proxy from being
     * resolved as a Promise-Like object.
     */
    then: never;
    /*
     * ### Private Remarks
     *
     * This method is used to set either the `part` property
     * or the `part` attribute of the element.
     * This needs to be overridden in the `ElementBuilder` type,
     * because the `part` property getter returns a `DOMTokenList`,
     * while the `part` property setter accepts a space-separated string
     * of tokens.
     */
    part: (value: string) => ElementBuilder<P, E, Q>;
    /*
     * ### Private Remarks
     *
     * This method is disabled for markup elements, because it's not an
     * API based on attributes, but rather an API based on the DOM.
     *
     * Consumers should use the `$attrs` method instead.
     */
    dataset: Q extends "dom"
      ? (dataset: ElementBuilder.DatasetInput) => ElementBuilder<P, E, Q>
      : never;
    /**
     * Access the underlying DOM element when rendered in the DOM.
     *
     * @remarks
     *
     * Useful for direct DOM operations like setting focus or measuring.
     * The ref is not called when rendered with the `render` function.
     */
    $ref: (ref?: ElementBuilder.Ref<E>) => ElementBuilder<P, E, Q>;
    /**
     * Set a key for the element to ensure stable identity for efficient
     * updates.
     *
     * @remarks
     *
     * Highly recommended when rendering lists to maintain element
     * identity across renders. Changing the key will cause the element
     * to be reconstructed.
     */
    $key: (key: string | undefined) => ElementBuilder<P, E, Q>;

    // TODO: Consider adding a `$data` method
    // that allows setting data attributes on the element individually.
    // The `name` parameter should detect `camelCase` or `kebab-case`
    // and convert it to the appropriate attribute or property
    // based on the element declaration type.
    //
    // $data: (name: string, value: string) => ElementBuilder<P, E, Q>;
  };

  /**
   * @internal scope: workspace
   */
  export type BatchMutators<
    P extends AnyProps = AnyProps,
    E extends AnyProps = P,
    Q extends "dom" | "markup" = "dom",
  > = {
    /**
     * Set properties of an element.
     */
    $props: Q extends "dom"
      ? (input: ElementBuilder.PropsInput<P, Q>) => ElementBuilder<P, E, Q>
      : never;
    /**
     * Set attributes of an element.
     */
    $attrs: Q extends "dom"
      ? (attrs: ElementBuilderDomAttributesInput) => ElementBuilder<P, E, Q>
      : (
          input: ElementBuilderMarkupAttributesInput<P>,
        ) => ElementBuilder<P, E, Q>;
  };

  /**
   * @internal scope: workspace
   */
  export type OverriddenEventsListenerMutators<
    P extends AnyProps = AnyProps,
    E extends AnyProps = P,
    Q extends "dom" | "markup" = "dom",
  > = Q extends "dom"
    ? {
        [K in keyof GlobalEventHandlers]-?: (
          value: OverrideHandlerEventTarget<P, P[K]> | null,
        ) => ElementBuilder<P, E, Q>;
      }
    : {};
}

/*
 * ### Private Remarks
 *
 * NOTE:
 *
 * tldr; The first union type must be a tuple with a single element.
 *
 * One of the union types for the parameter list MUST be a tuple
 * with a single element. This is because the fallback type for
 * unknown props/attributes resolves to `[any]` and TypeScript
 * will not allow a union that doesn't have at least one tuple
 * with a single element.
 *
 * Here we are satisfying that requirement by having accept either
 * a `ListenerDeclaration` or `ElementDeclarationListeners` as a single
 * parameter.
 */
export type ElementBuilderEventListenerParams<
  E extends AnyProps,
  T extends ListenerDeclarationType = ListenerDeclarationType,
> =
  | [declaration: ListenerDeclaration<E, T>]
  | [declarations: ElementDeclarationListeners<E, T>]
  | [
      type: T,
      // The handler is a required parameter, but it accepts
      // `undefined` to facilitate optional event handlers.
      // When the handler is `undefined`, the method should be a no-op.
      handler: EventHandler<E, EventFromType<T>> | undefined,
      options?: AddEventListenerOptions,
    ];

export type ElementBuilder<
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
  // TODO: Create an enum for this.
  Q extends "dom" | "markup" = "dom" | "markup",
> = ElementBuilder.ElementMutators<P, E, Q> &
  ElementBuilder.CommonMutators<P, E, Q> &
  ElementBuilder.BatchMutators<P, E, Q> &
  ElementBuilder.OverriddenEventsListenerMutators<P, E, Q>;

export namespace ElementBuilder {
  /**
   * A callback that receives the element or `null`.
   *
   * @public
   */
  export type Ref<E extends AnyProps> = ElementDeclaration.Ref<
    // Enforce that the ref is only called with the element type.
    E extends Element ? E : Element
  >;

  /**
   * A type representing an element builder with generics that have yet to be determined.
   *
   * @remarks
   *
   * This type should only be used for inputs.
   * Usage of `any` is intentional here, because where this type would be used,
   * the generic types are not yet determined.
   */
  export type Input = ElementBuilder<any, any, "dom" | "markup">;

  export type DOM<
    P extends AnyProps = AnyProps,
    E extends AnyProps = P,
  > = ElementBuilder<P, E, "dom">;

  export type Markup<
    P extends AnyProps = AnyProps,
    E extends AnyProps = P,
  > = ElementBuilder<P, E, "markup">;

  export type Fragment = ElementBuilder<{}, DocumentFragment, "dom" | "markup">;

  export namespace Fragment {
    export type DOM = ElementBuilder<{}, DocumentFragment, "dom">;
    export type Markup = ElementBuilder<{}, DocumentFragment, "markup">;
  }

  export type HTML<A extends AttributeDictionary = AttributeDictionary> =
    Markup<HTMLGlobalAttributes & A>;

  export type ToElement<T> =
    T extends ElementBuilder<any, infer E, any> ? E : never;

  /**
   * Props accepted by the batch mutators.
   *
   * @internal scope: workspace
   */
  export type PropsInput<
    P extends AnyProps,
    Q extends "dom" | "markup",
  > = {
  // prettier-ignore
  [K in keyof P]?:
  // If the property name is a key of `GlobalEventHandlers`,
  // and the element build is for the DOM...
  IsGlobalEventHandlersKeyAndForDOM<K, Q> extends true ?
    // ...then the value should be an event handler.
    // The event handler should be overridden to
    // have the correct event target.
    // If the event handler may also be set as `null`.
    (OverrideHandlerEventTarget<P, P[K]> | null)
  // Otherwise, if the property name is `style`,
  // and the object has a `style` property...
  : IsStyleKeyAndObjectHasStyleProperty<K, P> extends true ?
    // ...then the value should be a `StyleObject`.
    StyleObject
  // Otherwise, if the property name is a blocked property...
  : K extends PropsInput.BlockedPropertyName ?
    // ...then the value should be `never`.
    never
  // Otherwise, the value should be the property type.
  : P[K];
};

  export namespace PropsInput {
    /**
     * A list of properties that are blocked from being set
     * on the element builder.
     */
    /*
     * ### Private Remarks
     *
     * These properties are blocked to prevent the element builder
     * from being used in manner that is not intended.
     *
     * For example, the `outerHTML` and `outerText` properties
     * are blocked to prevent unsupported behavior, and `then`
     * is blocked to to prevent the element builder from being resolved
     * as a Promise-Like object by the renderer.
     */
    export type BlockedPropertyName = "outerHTML" | "outerText" | "then";
  }

  /**
   * @internal scope: workspace
   */
  export type Private<P extends AnyProps = AnyProps, E extends AnyProps = P> = {
    /**
     * @internal scope: workspace
     */
    [ElementBuilderIsElementSymbol]: true;
    /**
     * @internal scope: workspace
     */
    [ElementBuilderKindSymbol]: ElementBuilderKind;
    /**
     * @internal scope: workspace
     */
    [ElementBuilderTargetSymbol]: ElementDeclaration<P, E>;
  };

  export namespace Infer {
    export type DOM<T> = ElementBuilder.DOM<InferElement<T>>;
    export type HTML<T extends keyof HTMLAttributesByElementTagName> =
      ElementBuilder.Markup<InferElementProps.HTML<T>, InferElement<T>>;
  }
}

/**
 * @internal scope: package
 */
type NativeEventHandler<TEvent> = (this: any, event: TEvent) => any;

namespace NativeEventHandler {
  export type ToEvent<THandler> =
    NonNullable<THandler> extends NativeEventHandler<infer V>
      ? V extends Event
        ? V
        : Event
      : Event;
}

type OverrideHandlerEventTarget<TTarget, THandler> = EventHandler<
  TTarget,
  NativeEventHandler.ToEvent<THandler>
>;

/**
 * Check if a key is a key of `GlobalEventHandlers`,
 * and if the element build is for the DOM.
 */
type IsGlobalEventHandlersKeyAndForDOM<
  K,
  Q extends "dom" | "markup",
> = K extends keyof GlobalEventHandlers
  ? Q extends "dom"
    ? true
    : false
  : false;

/**
 * Check if a key is a key of `GlobalEventHandlers`,
 * and if the element build is for the DOM.
 */
type IsStyleKeyAndObjectHasStyleProperty<K, P> = K extends "style"
  ? P extends { style: CSSStyleDeclaration }
    ? true
    : false
  : false;

// TODO: Infer attributes based on the tag name, if present.
export type ElementBuilderDomAttributesInput = AttributeDictionary;

/**
 * Attributes accepted by the `$attrs` batch mutator on markup element builders.
 */
/*
 * ### Private Remarks
 *
 * Recognized attributes will be strictly type checked.
 * For example, the `type` attribute of an `<input>` element.
 * However, it allows for any unrecognized attributes to be
 * added as well.
 */
export type ElementBuilderMarkupAttributesInput<P extends AnyProps> =
  ElementBuilder.PropsInput<P, "markup"> & {
    [K: string]: any;
  };
