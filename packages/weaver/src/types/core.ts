import type { Observable } from "@knyt/artisan";
import type {
  HTMLElements as HTMLAttributesByElementTagName,
  HTMLGlobalAttributes,
  StyleObject,
  SVGElements as SVGAttributesByElementTagName,
  SVGGlobalAttributes,
  TypedEvent,
} from "@knyt/html-type";

import type {
  ElementBuilderDomHTMLSymbol,
  ElementBuilderDomSVGSymbol,
  ElementBuilderMarkupHTMLSymbol,
  ElementBuilderMarkupSVGSymbol,
  ElementDeclarationAttachmentSymbol,
  ElementDeclarationKind,
  ElementDeclarationSymbol,
  FragmentTypeSymbol,
} from "../constants.ts";
import type { RenderMode } from "../utils/mod.ts";
import type { ElementBuilder } from "./ElementBuilder.ts";
import type { ViewBuilder } from "./ViewBuilder.ts";

// Re-export types from `@knyt/html-type` for convenience,
// because they're used frequently in the renderer.
export type {
  TypedEvent,
  HTMLGlobalAttributes,
  HTMLAttributesByElementTagName,
  SVGAttributesByElementTagName,
};

export type Builder = ViewBuilder.Input | ElementBuilder.Input;

/**
 * @internal scope: package
 */
export type ElementBuilderKind =
  | typeof ElementBuilderDomHTMLSymbol
  | typeof ElementBuilderDomSVGSymbol
  | typeof ElementBuilderMarkupHTMLSymbol
  | typeof ElementBuilderMarkupSVGSymbol;

export type ElementBuilderFactory<
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
  Q extends "dom" | "markup" = "dom" | "markup",
> = (type: ElementType) => ElementBuilder<P, E, Q>;

/**
 * @public
 */
/*
 * ### Private Remarks
 *
 * This type is intended to be specific to the renderer and its usage.
 * It should not be moved to a more general library, because it is
 * intended to be used specifically within the context of the renderer.
 */
export type EventHandler<TTarget, TEvent extends Event> = (
  this: TTarget,
  event: TypedEvent<TTarget, TEvent>,
) => void;

export namespace EventHandler {
  // prettier-ignore
  export type Clipboard<T = Element> = EventHandler<T, ClipboardEvent>;
  // prettier-ignore
  export type Composition<T = Element> = EventHandler<T, CompositionEvent>;
  export type Drag<T = Element> = EventHandler<T, DragEvent>;
  export type Focus<T = Element> = EventHandler<T, FocusEvent>;
  export type Form<T = Element> = EventHandler<T, Event>;

  /*
   * ### Private Remarks
   *
   * All elements that emit change events are `HTMLElement`; including custom elements.
   * So the default type is set to `HTMLElement`. However, this it's not enforced,
   * to allow for more flexibility.
   */
  export type Change<T = HTMLElement> = EventHandler<T, Event>;
  /*
   * ### Private Remarks
   *
   * The types for the `Input` event are inconsistent, because the properties
   * of the event are different for different input types.
   *
   * Sometimes, the event is `InputEvent`, but other times it's `Event`.
   * As a result, the type is set to `Event` to cover all cases.
   */
  // TODO: Consider changing event to only `Event` for simplicity.
  export type Input<T = Element> = EventHandler<T, InputEvent | Event>;
  // prettier-ignore
  export type Keyboard<T = Element> = EventHandler<T, KeyboardEvent>;
  export type Mouse<T = Element> = EventHandler<T, MouseEvent>;
  export type Touch<T = Element> = EventHandler<T, TouchEvent>;
  export type Pointer<T = Element> = EventHandler<T, PointerEvent>;
  export type UI<T = Element> = EventHandler<T, UIEvent>;
  export type Scroll<T = Element> = EventHandler<T, Event>;
  export type Wheel<T = Element> = EventHandler<T, WheelEvent>;
  // prettier-ignore
  export type Animation<T = Element> = EventHandler<T, AnimationEvent>;
  // prettier-ignore
  export type Transition<T = Element> = EventHandler<T, TransitionEvent>;
}

/**
 * A DOM event that's compatible with the renderer.
 *
 * @remarks
 *
 * This is the `Event` type, but with deprecated properties omitted.
 *
 * @internal scope: workspace
 */
export type DOMEvent = Omit<
  Event,
  "cancelBubble" | "srcElement" | "returnValue" | "initEvent"
>;

// Re-export types from `@knyt/html-type` for convenience,
// because they're used frequently in the renderer.
export type { StyleObject };

/**
 * An alias for a `DOMStringMap` type, which is used to set the `dataset`
 * property of an element.
 */
export type DatasetObject = DOMStringMap;

export type HTMLElementTagName = keyof HTMLElementTagNameMap;

export namespace HTMLElementTagName {
  export type Input = HTMLElementTagName | string;
}

export type SVGElementTagName = keyof SVGElementTagNameMap;

/**
 * Fallback element type for unknown tag names.
 *
 * @remarks
 *
 * Unknown tag names are assumed to be custom elements which must extend `HTMLElement`.
 */
type DOMFallbackElement = HTMLElement & AnyProps;

// TODO: Rename for clarity. e.g. `ElementBuilderFactory.DOM`.
export type DOMBuilder = {
  [K in HTMLElementTagName]: ElementBuilder.DOM<HTMLElementTagNameMap[K]>;
} & {
  // Support unknown tag names and fallback to any props
  [tagName: string]: ElementBuilder.DOM<DOMFallbackElement>;
} & {
  fragment: ElementBuilder.DOM<{}, DocumentFragment>;
};

// This type intentionally doesn't support unknown tag names for
// SVG elements, because there's no supported way to create custom SVG
// elements; only custom HTML elements, and it's preferable for
// TypeScript to catch typos.
/** @deprecated SVG is only supported in the `Markup` builder. */
// TODO: Rename for clarity.
export type SVGBuilder = {
  [K in SVGElementTagName]: ElementBuilder.DOM<SVGElementTagNameMap[K]>;
} & {
  fragment: ElementBuilder.DOM<{}, DocumentFragment>;
};

export type MarkupTemplateTag = {
  /**
   * Template tag for creating a markup element declaration.
   *
   * WARNING: Ensure input is sanitized to prevent XSS attacks.
   * This API is intended for trusted content only.
   */
  (
    markup: TemplateStringsArray,
    ...values: (KnytContent | AttributeDictionary)[]
  ): ElementDeclaration.Fragment;
};

/**
 * An object representing the attributes of an element based on the
 * given tag name.
 *
 * @example
 *
 * ```ts
 * const attributes: HTMLAttributes<"button"> = {
 *  type: "button",
 * };
 * ```
 */
export type HTMLAttributes<T extends keyof HTMLAttributesByElementTagName> =
  Partial<HTMLAttributesByElementTagName[T]>;

/**
 * An object representing the attributes of an SVG element based on the
 * given tag name.
 *
 * @example
 *
 * ```ts
 * const attributes: SVGAttributes<"circle"> = {
 *  cx: 50,
 * };
 * ```
 */
export type SVGAttributes<T extends keyof SVGAttributesByElementTagName> =
  Partial<SVGAttributesByElementTagName[T]>;

// TODO: Rename for clarity.
export type HTMLRenderer = {
  [K in keyof HTMLAttributesByElementTagName]: ElementBuilder.Markup<
    HTMLAttributesByElementTagName[K],
    HTMLElementTagNameMap[K]
  >;
} & {
  // Support unknown tag names and fallback to any attributes
  [tagName: string]: ElementBuilder.Markup<
    HTMLGlobalAttributes & AttributeDictionary,
    Element
  >;
} & {
  fragment: ElementBuilder.Markup<{}, DocumentFragment>;
} & MarkupTemplateTag;

// This shouldn't need to support unknown tag names for SVG elements.
// It's preferable for TypeScript to catch typos, because there's no
// supported way to create custom SVG Elements; only custom HTML elements.
// TODO: Rename for clarity.
export type SVGRenderer = {
  [K in keyof SVGAttributesByElementTagName]: ElementBuilder.Markup<
    SVGAttributesByElementTagName[K],
    SVGElementTagNameMap[K]
  >;
} & {
  fragment: ElementBuilder.Markup<{}, DocumentFragment>;
} & MarkupTemplateTag;

export type ElementType =
  | SingularElement.TagName
  | typeof FragmentTypeSymbol
  | string;

/**
 * A type representing any object with string keys and values of any type.
 */
/*
 * ### Private Remarks
 *
 * This is a very simple type, but it's used in many places.
 * To ensure consistency, it's defined here for use throughout the codebase.
 *
 * It's shouldn't be renamed into something more generic, because it's
 * value comes from the intention expressed in the name.
 *
 * @internal scope: workspace
 */
export type AnyProps = Record<string, any>;

export type FlattenedElementDeclarationChild =
  | ElementDeclaration.Singular
  | Element
  | string;

export type FlattenedElementDeclarationChildren =
  FlattenedElementDeclarationChild[];

/*
 * ### Private Remarks
 *
 * For use with Builder proxies after a proxies property name
 * doesn't match any known properties and should be treated as a
 * mutator method.
 *
 * @internal scope: workspace
 */
export type UnknownProps = Record<string | symbol, unknown>;

/**
 * The event type.
 *
 * @remarks
 *
 * This is the same as the first argument of `EventTarget.addEventListener`.
 * This type should be a `string` primitive, not a union of event types,
 * for flexibility and compatibility with the renderer.
 *
 * @example "click"
 */
export type ListenerDeclarationType = string;

/**
 * Infer the event instance type from the event listener type.
 */
export type EventFromType<T extends ListenerDeclarationType> =
  T extends keyof GlobalEventHandlersEventMap
    ? GlobalEventHandlersEventMap[T]
    : Event;

export type ListenerDeclaration<
  E extends AnyProps = AnyProps,
  T extends ListenerDeclarationType = ListenerDeclarationType,
> = {
  readonly type: T;
  readonly handler: EventHandler<E, EventFromType<T>>;
  readonly options?: AddEventListenerOptions;
};

/**
 * A key used to identify a listener.
 *
 * @remarks
 *
 * This key is used to identify a listener in an element declaration.
 * The key is used to add, update, or remove a listener from an element.
 *
 * Typically, yhe key is a string that represents the event type and the capture phase.
 * However, the key can be any string, because the renderer doesn't enforce the format.
 *
 * @example "click"
 * @example "click__capture"
 * @example "custom-event"
 * @example "custom-event__capture"
 * @example "myKey123"
 */
export type ElementDeclarationListenersKey = string;

/**
 * A dictionary of listeners for an element declaration.
 */
/*
 * ### Private Remarks
 *
 * The type is a dictionary of listeners, where the key is a string
 * that represents the event type and the capture phase.
 * A dictionary was chosen, because we only want to support one listener
 * per event type and capture phase.
 */
export type ElementDeclarationListeners<
  E extends AnyProps = AnyProps,
  T extends ListenerDeclarationType = ListenerDeclarationType,
> = Record<ElementDeclarationListenersKey, ListenerDeclaration<E, T>>;

/**
 * An element declaration to build or render an element.
 */
/*
 * ### Private Remarks
 *
 * Properties that may be `undefined` are not optional,
 * because the value of ensuring that no property is accidentally
 * omitted is more important than the convenience of optional properties.
 */
export type ElementDeclaration<
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
> = {
  [ElementDeclarationSymbol]: true;
  type: ElementType;
  kind: ElementDeclarationKind;
  /**
   * A dictionary of either properties or attributes.
   *
   * @remarks
   *
   * How `props` are set depends on the type of element builder.
   *
   * - DOM element builders
   *    - Sets element properties as `props`.
   *    - Sets `props` by calling methods for individual properties,
   *      or by calling the `$props` method.
   *    - The `$attrs` method will not set `props`; it will instead set `attributes`.
   * - Markup element builders
   *    - Sets element attributes as `props`.
   *    - Sets `props` by calling methods for individual attributes,
   *      or by calling the `$attrs` method.
   *    - The `$props` method is not available for markup elements.
   */
  props: P;
  children: readonly ElementDeclaration.Child[];
  ref: ElementDeclaration.Ref<E> | undefined;
  key: string | undefined;
  listeners: ElementDeclarationListeners<E> | undefined;
  renderMode: RenderMode | undefined;
  /**
   * A dictionary of attributes for the element.
   */
  /*
   * ### Private Remarks
   *
   * Unlike `props`, which may be either properties or attributes,
   * depending on the type of element builder, `attributes` are always
   * attributes.
   */
  attributes: ElementDeclaration.Attributes | undefined;
};

export namespace ElementDeclaration {
  /**
   * Alias of `ElementBuilder.Child` for clarity.
   */
  export type Child = ElementBuilder.Child;

  export type Tree = Omit<ElementDeclaration, "children"> & {
    children: readonly (Tree | ElementBuilder.Child.Basic)[];
  };

  // An alias for consistency.
  export type Attributes = AttributeDictionary;

  // An alias for consistency.
  export type Props = AnyProps;

  export type Key = string;

  /**
   * A handler to set a reference to an element.
   */
  export type Ref<E extends AnyProps> = Observable.Subscriber<E | null>;

  /**
   * A type representing an element declaration with generics that have yet to be determined.
   *
   * @remarks
   *
   * This type should only be used for inputs.
   * Usage of `any` is intentional here, because where this type would be used,
   * the generic types are not yet determined.
   */
  export type Input = ElementDeclaration<any, any>;

  /**
   * A type for an element declaration that is used internally.
   *
   * @remarks
   *
   * This type helps ensure that operations on element declarations
   * are type-safe and consistent throughout the renderer.
   * It is not intended to be used directly by users, and shouldn't
   * be exposed in the public API.
   */
  export type Internal = ElementDeclaration<AnyProps, Element>;

  /**
   * An `ElementDeclaration` to build a HTML element using the DOM.
   */
  export type DomHTML<
    P extends AnyProps = AnyProps,
    E extends HTMLElement = HTMLElement,
  > = {
    [ElementDeclarationSymbol]: true;
    type: HTMLElementTagName;
    kind: ElementDeclarationKind.DomHTML;
    props: P;
    children: readonly ElementDeclaration.Child[];
    ref: Ref<E> | undefined;
    key: string | undefined;
    listeners: ElementDeclarationListeners<E> | undefined;
    renderMode: RenderMode | undefined;
    attributes: ElementDeclaration.Attributes | undefined;
  };

  /**
   * An `ElementDeclaration` to build a SVG element using the DOM.
   *
   * @deprecated SVG should only be rendered as markup, not built using the DOM.
   */
  export type DomSVG<
    P extends AnyProps = AnyProps,
    E extends SVGElement = SVGElement,
  > = {
    [ElementDeclarationSymbol]: true;
    type: SVGElementTagName;
    kind: ElementDeclarationKind.DomSVG;
    props: P;
    children: readonly ElementDeclaration.Child[];
    ref: Ref<E> | undefined;
    key: string | undefined;
    listeners: ElementDeclarationListeners<E> | undefined;
    renderMode: RenderMode | undefined;
    attributes: ElementDeclaration.Attributes | undefined;
  };

  /**
   * An `ElementDeclaration` to build an element using the DOM.
   */
  export type DOM = DomHTML | DomSVG;

  /**
   * Special properties that are common to all element builders.
   */
  export type SpecialProps = {
    style?: ElementBuilder.StyleInput;
    dataset?: ElementBuilder.DatasetInput;
  };

  /**
   * Properties for markup elements.
   *
   * @internal scope: workspace
   */
  export type MarkupProps<A = AttributeDictionary> = A & SpecialProps;

  /**
   * An `ElementDeclaration` to render a HTML element as markup.
   */
  export type MarkupHTML<E extends HTMLElement = HTMLElement> = {
    [ElementDeclarationSymbol]: true;
    type: HTMLElementTagName;
    kind: ElementDeclarationKind.MarkupHTML;
    props: MarkupProps;
    children: readonly ElementDeclaration.Child[];
    ref: Ref<E> | undefined;
    key: string | undefined;
    /**
     * Listeners is `undefined` for markup elements.
     */
    listeners: undefined;
    renderMode: RenderMode | undefined;
    attributes: ElementDeclaration.Attributes | undefined;
  };

  /**
   * An `ElementDeclaration` to render a SVG element as markup.
   */
  export type MarkupSVG<E extends SVGElement = SVGElement> = {
    [ElementDeclarationSymbol]: true;
    type: SVGElementTagName;
    kind: ElementDeclarationKind.MarkupSVG;
    props: MarkupProps;
    children: readonly ElementDeclaration.Child[];
    ref: Ref<E> | undefined;
    key: string | undefined;
    /**
     * Listeners is `undefined` for markup elements.
     */
    listeners: undefined;
    renderMode: RenderMode | undefined;
    attributes: ElementDeclaration.Attributes | undefined;
  };

  /**
   * An `ElementDeclaration` to render an element as markup.
   */
  export type Markup = MarkupHTML | MarkupSVG;

  /**
   * An `ElementDeclaration` to build or render a fragment.
   */
  export type Fragment = {
    readonly [ElementDeclarationSymbol]: true;
    readonly type: typeof FragmentTypeSymbol;
    readonly kind: ElementDeclarationKind;
    readonly props: {};
    readonly children: readonly ElementDeclaration.Child[];
    readonly ref: undefined;
    readonly key: undefined;
    /**
     * Fragments don't have event listeners.
     */
    readonly listeners: undefined;
    /**
     * Fragments don't have a render mode.
     */
    readonly renderMode: undefined;
    /**
     * Fragments don't have attributes.
     */
    readonly attributes: undefined;
  };

  export type Singular = {
    [ElementDeclarationSymbol]: true;
    type: SingularElement.TagName;
    kind: ElementDeclarationKind;
    props: AnyProps;
    children: readonly ElementDeclaration.Child[];
    ref: Ref<HTMLElement | SVGElement> | undefined;
    key: string | undefined;
    listeners:
      | ElementDeclarationListeners<HTMLElement | SVGElement>
      | undefined;
    renderMode: RenderMode | undefined;
    attributes: ElementDeclaration.Attributes | undefined;
  };
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
    T extends ElementDeclaration.Fragment ? DocumentFragment :
    T extends ElementDeclaration<infer P, infer E> ?
      E extends P ? E : never : never;
}

/**
 * An element representing a single DOM node.
 *
 * @remarks
 *
 * This is neither a `DocumentFragment` nor a `Text` node.
 * A `DocumentFragment` is a collection of nodes, and a `Text` node isn't an element.
 *
 * @internal scope: package
 */
export type SingularElement = HTMLElement | SVGElement;

export namespace SingularElement {
  export type TagName = HTMLElementTagName | SVGElementTagName;

  export namespace TagName {
    export type Input = TagName | string;
  }

  export type WithDeclaration<
    E extends SingularElement,
    P extends AnyProps = AnyProps,
  > = E & {
    [ElementDeclarationAttachmentSymbol]: ElementDeclaration<P, E>;
  };
}

/**
 * A parent node that can contain child elements.
 *
 * @remarks
 *
 * While `DocumentFragment` is a parent node, it's not included for clarity.
 * The intention is for `ParentElement` to represent either single node or a shadow root.
 * In the context of the renderer, `DocumentFragment` is treated as a collection of nodes,
 * not a single node.
 */
/*
 * ### Private Remarks
 *
 * This is intended to be used as a target for the `update` function.
 */
export type UpdatableParentNode = Element | ShadowRoot;

/**
 * Recognized values to set attributes using the renderer.
 */
export type AttributeValue =
  | string
  | boolean
  | AttributeValue.Object
  | number
  | undefined
  | null;

export namespace AttributeValue {
  /**
   * An object that can be serialized to a JSON string.
   */
  export type Object = Record<string, any>;
}

/**
 * A dictionary of attributes for an element.
 * Unlike `AnyProps`, the values are limited to `AttributeValue`.
 */
export type AttributeDictionary = Record<string, AttributeValue>;

/**
 * A declaration of an element to be built or rendered.
 *
 * @remarks
 *
 * Inputs for the `build`, `render`, and `update` functions.
 */
/*
 * ### Private Remarks
 *
 * The default generic types are set to `any` to allow for flexibility
 * in the declaration. Particularly, this allows for `ElementDeclaration`s
 * to be provided directly to the declaration processors without needing to
 * wrap them in a fragment declaration.
 */
export type KnytDeclaration<
  P extends AnyProps = any,
  E extends AnyProps = any,
> =
  | ElementBuilder<P, E, "dom" | "markup">
  | ViewBuilder<P, E>
  | ElementDeclaration<P, E>;

export namespace KnytDeclaration {
  export type ToProps<T> = T extends KnytDeclaration<infer P, any> ? P : never;

  /*
   * ### Private Remarks
   *
   * The type needs to be written this way for TypeScript to
   * accurately infer the type of the element. Otherwise,
   * TypeScript will infer the type as `Element | DocumentFragment`
   * instead of the specific type of the element.
   */
  // prettier-ignore
  export type ToNode<T> =
    T extends ElementBuilder<any, any> ? ElementBuilder.ToNode<T> :
    T extends ViewBuilder<any, any> ? ViewBuilder.ToNode<T> :
    T extends ElementDeclaration<any, any> ? ElementDeclaration.ToNode<T> : never;

  export type ToAssignmentMethod<T> =
    T extends ElementBuilder<any, any, infer Q> ? Q : unknown;

  // prettier-ignore
  export type FromNode<T> =
    T extends SingularElement ? KnytDeclaration<any, T> :
    T extends DocumentFragment ? KnytDeclaration<any, DocumentFragment> : never;
}

/**
 * A node that's recognized by the renderer.
 */
export type KnytNode = Element | KnytDeclaration;

/**
 * Content that can be rendered in the renderer.
 */
export type KnytContent = KnytNode | number | string | null | undefined | false;

/**
 * The return type of a render function.
 *
 * @public
 */
export type RenderResult = KnytContent | Promise<KnytContent>;

export namespace InferElementProps {
  /**
   * @internal scope: workspace
   */
  export type HTML<T> = T extends keyof HTMLAttributesByElementTagName
    ? ElementDeclaration.MarkupProps<HTMLAttributes<T>>
    : ElementDeclaration.MarkupProps<HTMLGlobalAttributes>;

  /**
   * @internal scope: workspace
   */
  export type SVG<T> = T extends keyof SVGAttributesByElementTagName
    ? ElementDeclaration.MarkupProps<SVGAttributes<T>>
    : ElementDeclaration.MarkupProps<SVGGlobalAttributes>;

  /**
   * @internal scope: workspace
   */
  export type DOM<T> = ElementBuilder.PropsInput<InferElement<T>, "dom">;
}

export type InferElement<T> = T extends HTMLElementTagName
  ? HTMLElementTagNameMap[T]
  : T extends SVGElementTagName
    ? SVGElementTagNameMap[T]
    : Element;
