// TODO: Break this module up into smaller modules

import {
  isDocumentFragment,
  isElement,
  isHTMLElement,
  isNonNullableObject,
  isObserver,
  isSVGElement,
  isText,
  isUnknownDictionary,
  normalizeSubscriber,
  type Observer,
} from "@knyt/artisan";

import {
  ElementBuilderDomHTMLSymbol,
  ElementBuilderDomSVGSymbol,
  ElementBuilderIsElementSymbol,
  ElementBuilderKindSymbol,
  ElementBuilderMarkupHTMLSymbol,
  ElementBuilderMarkupSVGSymbol,
  ElementBuilderTargetSymbol,
  ElementDeclarationAttachmentSymbol,
  ElementDeclarationKind,
  ElementDeclarationSymbol,
  FragmentTypeSymbol,
  KEY_ATTRIBUTE,
  KEY_DATASET_PROPERTY,
  ViewBuilderIsViewSymbol,
  ViewBuilderTargetSymbol,
  ViewDeclarationSymbol,
} from "../constants.ts";
import type {
  AnyProps,
  ElementBuilder,
  ElementDeclaration,
  ElementDeclarationListeners,
  ElementDeclarationListenersKey,
  ElementType,
  HTMLElementTagName,
  ListenerDeclaration,
  ListenerDeclarationType,
  SingularElement,
  View,
  ViewBuilder,
  ViewDeclaration,
} from "../types/mod.ts";
import { isStringDocumentFragment } from "./StringDocumentFragment.ts";

// Banned globals
declare const document: never;
declare const window: never;

/**
 * A type guard that determines if a value is a ref handler.
 *
 * @internal scope: workspace
 */
/*
 * ### Private Remarks
 *
 * This type guard is used internally by the renderer to determine if a value is a ref mutator.
 * The implementation is very simple, so we're making an assumption that the given function is a ref mutator.
 * The main purpose of this type guard is to provide type safety when using ref mutators.
 */
export function isElementDeclarationRe<E extends AnyProps = Element>(
  value: unknown,
): value is ElementDeclaration.Ref<E> {
  // We assume that any function is a next handler
  return typeof value == "function" || isObserver(value);
}

/**
 * Determines if a value is valid input for an element declaration ref.
 */
export function isElementDeclarationRefInput<E extends AnyProps = Element>(
  value: unknown,
): value is ElementDeclaration.Ref<E> | undefined {
  return value === undefined || isElementDeclarationRe(value);
}

/**
 * Determines if a value is a valid key for an element declaration.
 */
export function isElementDeclarationKey(
  value: unknown,
): value is ElementDeclaration.Key {
  return typeof value === "string";
}

/**
 * Determines if a value is valid input for an element declaration key.
 */
export function isElementDeclarationKeyInput(
  value: unknown,
): value is ElementDeclaration.Key | undefined {
  return value === undefined || isElementDeclarationKey(value);
}

/**
 * Determines if a value are valid props for an element declaration.
 */
export function isElementDeclarationProps(
  value: unknown,
): value is ElementDeclaration.Props {
  return isUnknownDictionary(value);
}

/**
 * Determines if a value are valid attributes for an element declaration.
 */
export function isElementDeclarationAttributes(
  value: unknown,
): value is ElementDeclaration.Attributes {
  return isUnknownDictionary(value);
}

/**
 * Determines if a value is valid input for an element declaration attributes.
 */
export function isElementDeclarationAttributesInput(
  value: unknown,
): value is ElementDeclaration.Attributes | undefined {
  return value === undefined || isElementDeclarationAttributes(value);
}

export function isElementDeclarationPropsInput(
  value: unknown,
): value is ElementDeclaration.Props | undefined {
  return value === undefined || isElementDeclarationProps(value);
}

/**
 * Normalizes an element declaration ref to a ref handler.
 *
 * @internal scope: workspace
 */
export function normalizeElementDeclarationRef<E extends AnyProps = Element>(
  ref: ElementDeclaration.Ref<E> | undefined,
): Observer<E | null> | undefined {
  return normalizeSubscriber(ref);
}

export function isElementBuilder<
  T extends ElementBuilder.Input = ElementBuilder<
    AnyProps,
    AnyProps,
    "dom" | "markup"
  >,
>(value: unknown): value is T {
  return (
    typeof value == "object" &&
    value !== null &&
    (value as unknown as ElementBuilder.Private)[
      ElementBuilderIsElementSymbol
    ] === true
  );
}

export function assertElementBuilder<
  T extends ElementBuilder.Input = ElementBuilder<
    AnyProps,
    AnyProps,
    "dom" | "markup"
  >,
>(value: unknown): asserts value is T {
  if (!isElementBuilder(value)) {
    throw new TypeError("Invalid element builder");
  }
}

export function isViewBuilder<
  T extends ViewBuilder.Input = ViewBuilder<AnyProps, AnyProps>,
>(value: unknown): value is T {
  return (
    typeof value == "object" &&
    value !== null &&
    (value as unknown as ViewBuilder.Private)[ViewBuilderIsViewSymbol] === true
  );
}

export function assertViewBuilder<
  T extends ViewBuilder.Input = ViewBuilder<AnyProps, AnyProps>,
>(value: unknown): asserts value is T {
  if (!isViewBuilder(value)) {
    throw new TypeError("Invalid view builder");
  }
}

export namespace isElementBuilder {
  export function MarkupHTML(
    builder: ElementBuilder.Input,
  ): builder is ElementBuilder<
    AnyProps,
    HTMLElement | DocumentFragment,
    "markup"
  > {
    return (
      (builder as unknown as ElementBuilder.Private)[
        ElementBuilderKindSymbol
      ] === ElementBuilderMarkupHTMLSymbol
    );
  }

  export function MarkupSVG(
    builder: ElementBuilder.Input,
  ): builder is ElementBuilder<
    AnyProps,
    SVGElement | DocumentFragment,
    "markup"
  > {
    return (
      (builder as unknown as ElementBuilder.Private)[
        ElementBuilderKindSymbol
      ] === ElementBuilderMarkupSVGSymbol
    );
  }

  export function Markup(
    builder: ElementBuilder.Input,
  ): builder is ElementBuilder<
    AnyProps,
    SingularElement | DocumentFragment,
    "markup"
  > {
    return MarkupHTML(builder) || MarkupSVG(builder);
  }

  function DomHTML(
    builder: ElementBuilder.Input,
  ): builder is ElementBuilder<
    AnyProps,
    HTMLElement | DocumentFragment,
    "dom"
  > {
    return (
      (builder as unknown as ElementBuilder.Private)[
        ElementBuilderKindSymbol
      ] === ElementBuilderDomHTMLSymbol
    );
  }

  /** @deprecated SVG is only supported in the `Markup` builder. */
  function DomSVG(
    builder: ElementBuilder.Input,
  ): builder is ElementBuilder<AnyProps, SVGElement | DocumentFragment, "dom"> {
    return (
      (builder as unknown as ElementBuilder.Private)[
        ElementBuilderKindSymbol
      ] === ElementBuilderDomSVGSymbol
    );
  }

  // TODO: Rename for clarity
  export function DOM(
    builder: ElementBuilder.Input,
  ): builder is ElementBuilder<
    AnyProps,
    SingularElement | DocumentFragment,
    "dom"
  > {
    return DomHTML(builder) || DomSVG(builder);
  }

  export function Valid(input: ElementBuilder.Input): boolean {
    return Markup(input) || DOM(input);
  }

  export function assertValid(input: ElementBuilder.Input): asserts input {
    if (!Valid(input)) {
      throw new TypeError("Unknown element builder kind");
    }
  }

  export function Fragment(
    builder: ElementBuilder.Input,
  ): builder is ElementBuilder.Fragment {
    return isElementDeclaration.Fragment(
      getElementDeclarationFromElementBuilder(builder),
    );
  }
}

/**
 * Attaches an element declaration to a singular element.
 */
/*
 * ### Private Remarks
 *
 * Element declarations are not attached to fragments,
 * because fragments are transient and treated as a collection of nodes.
 * Element declarations are only attached to singular elements that
 * will persist in the DOM.
 */
export function attachElementDeclaration<E extends SingularElement>(
  element: E,
  declaration: ElementDeclaration<AnyProps, E>,
): SingularElement.WithDeclaration<E> {
  (element as SingularElement.WithDeclaration<E>)[
    ElementDeclarationAttachmentSymbol
  ] = declaration;

  return element as SingularElement.WithDeclaration<E>;
}

/**
 * Determines if the element has an element declaration attached to it.
 *
 * @public
 * @alpha
 */
// TODO: Rename to `elementHasElementDeclaration`?
export function hasElementDeclaration<T extends SingularElement>(
  el: T,
): el is SingularElement.WithDeclaration<T> {
  return ElementDeclarationAttachmentSymbol in el;
}

/**
 * Determines if the element can have an element declaration attached to it.
 *
 * @public
 * @alpha
 */
/*
 * ### Private Remarks
 *
 * This is an alias of `isSingularElement` for clarity of intent and future-proofing
 */
// TODO: Rename to `canElementHaveElementDeclaration`?
export const canHaveDeclaration = isSingularElement;

/**
 * Gets the element declaration attached to a given value.
 *
 * @public
 * @alpha
 */
// TODO: Rename to `getElementDeclarationFromElement`?
export function getElementDeclaration(
  value: unknown,
): Readonly<ElementDeclaration<AnyProps, SingularElement>> | undefined {
  return canHaveDeclaration(value) && hasElementDeclaration(value)
    ? value[ElementDeclarationAttachmentSymbol]
    : undefined;
}

/**
 * Gets the key of an element declaration from the key attribute.
 *
 * @internal scope: package
 */
function getElementDeclarationKeyFromAttribute(
  value: Node,
): string | undefined {
  if (isHTMLElement(value)) {
    return value.dataset[KEY_DATASET_PROPERTY];
  }
  if (isElement(value)) {
    return value.getAttribute(KEY_ATTRIBUTE) ?? undefined;
  }
  return undefined;
}

/**
 * Gets the key of an element declaration from a given node.
 *
 * If the node is an element, it will first check if the element has an
 * attached element declaration. If not, it will check for the key attribute.
 *
 * @public
 */
// TODO: Rename for clarity, e.g. `getKeyFromNode`?
export function getElementDeclarationKey(value: Node): string | undefined {
  return (
    getElementDeclaration(value)?.key ??
    getElementDeclarationKeyFromAttribute(value)
  );
}

/**
 * Gets the mutable element declaration from an element builder.
 *
 * @internal scope: workspace
 */
// TODO: Rename for clarity
export function getMutableElementDeclarationFromElementBuilder<
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
>(builder: ElementBuilder<P, E>): ElementDeclaration<P, E> {
  return (builder as unknown as ElementBuilder.Private<P, E>)[
    ElementBuilderTargetSymbol
  ];
}

/**
 * Gets the mutable view declaration from an view builder.
 *
 * @internal scope: workspace
 */
export function getMutableViewDeclarationFromViewBuilder<
  P extends AnyProps = AnyProps,
  E extends AnyProps = Element,
>(builder: ViewBuilder<P, E>): ViewDeclaration<P, E> {
  return (builder as unknown as ViewBuilder.Private<P, E>)[
    ViewBuilderTargetSymbol
  ];
}

/**
 * Gets the readonly view declaration from an view builder.
 *
 * @internal scope: workspace
 */
export function getViewDeclaration<
  P extends AnyProps = AnyProps,
  E extends AnyProps = Element,
>(builder: ViewBuilder<P, E>): Readonly<ViewDeclaration<P, E>> {
  return getMutableViewDeclarationFromViewBuilder(builder);
}

/**
 * Gets the element declaration from a singular element.
 *
 * @public
 * @alpha
 */
/*
 * ### Private Remarks
 *
 * This function returns a readonly version of the element declaration,
 * to prevent mutation of the element declaration.
 * We want to discourage mutation of the element declaration,
 * outside of the element builder API, to prevent unexpected behavior.
 */
export function getElementDeclarationFromElementBuilder<
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
>(builder: ElementBuilder<P, E>): Readonly<ElementDeclaration<P, E>> {
  return getMutableElementDeclarationFromElementBuilder(builder);
}

/**
 * Extracts the element type from an element builder.
 */
export function getElementBuilderType<
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
>(builder: ElementBuilder<P, E>): ElementType {
  return getElementDeclarationFromElementBuilder(builder).type;
}

/**
 * Extracts the element type from an element builder.
 */
export function extractTagNameFromElementBuilder<
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
>(builder: ElementBuilder<P, E>): SingularElement.TagName.Input | undefined {
  const elementType = getElementBuilderType(builder);

  return elementType === FragmentTypeSymbol ? undefined : elementType;
}

export function isElementBuilderChildBasic(
  value: unknown,
): value is ElementBuilder.Child.Basic {
  return (
    isElement(value) ||
    isDocumentFragment(value) ||
    isStringDocumentFragment(value) ||
    typeof value === "string" ||
    typeof value === "number" ||
    value == null ||
    value === false
  );
}

export function isElementDeclaration<
  T extends ElementDeclaration.Input = ElementDeclaration,
>(value: unknown): value is T {
  return (
    isNonNullableObject(value) &&
    ElementDeclarationSymbol in value &&
    value[ElementDeclarationSymbol] === true
  );
}

export function isViewDeclaration<
  T extends ViewDeclaration.Input = ViewDeclaration,
>(value: unknown): value is T {
  return (
    isNonNullableObject(value) &&
    ViewDeclarationSymbol in value &&
    value[ViewDeclarationSymbol] === true
  );
}

export function isElementDeclarationKindDom(
  kind: ElementDeclarationKind,
): kind is ElementDeclarationKind.DomHTML | ElementDeclarationKind.DomSVG {
  return (
    kind === ElementDeclarationKind.DomHTML ||
    kind === ElementDeclarationKind.DomSVG
  );
}

export function isElementDeclarationKindMarkup(
  kind: ElementDeclarationKind,
): kind is
  | ElementDeclarationKind.MarkupHTML
  | ElementDeclarationKind.MarkupSVG {
  return (
    kind === ElementDeclarationKind.MarkupHTML ||
    kind === ElementDeclarationKind.MarkupSVG
  );
}

export namespace isElementDeclaration {
  export function DomHTML(
    declaration: unknown,
  ): declaration is ElementDeclaration.DomHTML {
    return (
      isElementDeclaration(declaration) &&
      declaration.kind === ElementDeclarationKind.DomHTML
    );
  }

  export function DomSVG(
    declaration: unknown,
  ): declaration is ElementDeclaration.DomSVG {
    return (
      isElementDeclaration(declaration) &&
      declaration.kind === ElementDeclarationKind.DomSVG
    );
  }

  export function DOM(element: unknown): element is ElementDeclaration.DOM {
    return DomHTML(element) || DomSVG(element);
  }

  export function MarkupHTML(
    declaration: unknown,
  ): declaration is ElementDeclaration.MarkupHTML {
    return (
      isElementDeclaration(declaration) &&
      declaration.kind === ElementDeclarationKind.MarkupHTML
    );
  }

  export function MarkupSVG(
    declaration: unknown,
  ): declaration is ElementDeclaration.MarkupSVG {
    return (
      isElementDeclaration(declaration) &&
      declaration.kind === ElementDeclarationKind.MarkupSVG
    );
  }

  export function Markup(
    element: unknown,
  ): element is ElementDeclaration.Markup {
    return MarkupHTML(element) || MarkupSVG(element);
  }

  export function Fragment(
    declaration: unknown,
  ): declaration is ElementDeclaration.Fragment {
    return (
      isElementDeclaration(declaration) &&
      declaration.type === FragmentTypeSymbol
    );
  }

  export function Singular(
    declaration: unknown,
  ): declaration is ElementDeclaration.Singular {
    return isElementDeclaration(declaration) && !Fragment(declaration);
  }
}

export function cloneElementDeclaration<
  P extends AnyProps,
  E extends AnyProps = P,
>(declaration: ElementDeclaration<P, E>): ElementDeclaration<P, E> {
  return {
    [ElementDeclarationSymbol]: true,
    kind: declaration.kind,
    type: declaration.type,
    props: { ...declaration.props },
    children: [...declaration.children],
    ref: declaration.ref,
    key: declaration.key,
    listeners: { ...declaration.listeners },
    renderMode: declaration.renderMode,
    attributes: { ...declaration.attributes },
  };
}

export function createEmptyElementDeclaration<
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
>(type: ElementType, kind: ElementDeclarationKind): ElementDeclaration<P, E> {
  return {
    [ElementDeclarationSymbol]: true,
    type,
    kind,
    props: {} as P,
    children: [],
    ref: undefined,
    key: undefined,
    listeners: undefined,
    renderMode: undefined,
    attributes: undefined,
  };
}

export function createEmptyView<
  P extends AnyProps = AnyProps,
  E extends AnyProps = Element,
>(render: View.RenderFn<P, E>): ViewDeclaration<P, E> {
  return {
    [ViewDeclarationSymbol]: true,
    props: {} as P,
    children: [],
    ref: undefined,
    key: undefined,
    render,
  };
}

export function cloneView<
  P extends AnyProps = AnyProps,
  E extends AnyProps = Element,
>(view: ViewDeclaration<P, E>): ViewDeclaration<P, E> {
  return {
    [ViewDeclarationSymbol]: true,
    props: { ...view.props },
    children: [...view.children],
    ref: view.ref,
    key: view.key,
    render: view.render,
  };
}

export function nodesToElementBuilderChildren(
  childNodes: NodeListOf<ChildNode>,
): ElementBuilder.Child[] {
  return Array.from(childNodes)
    .map((childNode) => (isText(childNode) ? childNode.textContent : childNode))
    .filter(isElementBuilderChild) as ElementBuilder.Child[];
}

export function isElementBuilderChild(
  value: unknown,
): value is ElementBuilder.Child {
  return (
    isElementDeclaration(value) ||
    isElementBuilder(value) ||
    isViewBuilder(value) ||
    isElementBuilderChildBasic(value)
  );
}

export function isElementBuilderChildren(
  value: unknown,
): value is ElementBuilder.Child[] {
  if (!Array.isArray(value)) return false;

  for (const child of value) {
    if (!isElementBuilderChild(child)) {
      return false;
    }
  }

  return true;
}

export function isSingularElement(value: unknown): value is SingularElement {
  return isHTMLElement(value) || isSVGElement(value);
}

export function getSingularElementTagName(
  el: SingularElement,
): SingularElement.TagName {
  return el.tagName.toLowerCase() as HTMLElementTagName;
}

export function normalizeChildren(
  child: ElementBuilder.Child | ElementBuilder.Child[],
): ElementBuilder.Child[] {
  if (Array.isArray(child)) {
    return child;
  }

  return [child];
}

/**
 * Determines if a value is a listener declaration.
 *
 * @internal scope: workspace
 */
export function isListenerDeclaration<
  E extends AnyProps = AnyProps,
  T extends ListenerDeclarationType = ListenerDeclarationType,
>(value: unknown): value is ListenerDeclaration<E, T> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ListenerDeclaration<E, T>).type === "string" &&
    typeof (value as ListenerDeclaration<E, T>).handler === "function" &&
    (typeof (value as ListenerDeclaration<E, T>).options === "object" ||
      (value as ListenerDeclaration<E, T>).options === undefined)
  );
}

export function isElementDeclarationListeners<
  E extends AnyProps = AnyProps,
  T extends ListenerDeclarationType = ListenerDeclarationType,
>(value: unknown): value is ElementDeclarationListeners<E, T> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.keys(value).every((key) =>
      isListenerDeclaration((value as ElementDeclarationListeners<E, T>)[key]),
    )
  );
}

export function discernDeclarationListeners<
  E extends AnyProps = AnyProps,
  T extends ListenerDeclarationType = ListenerDeclarationType,
>(
  value: ListenerDeclaration<E, T> | ElementDeclarationListeners<E, T>,
): value is ElementDeclarationListeners<E, T> {
  return "type" in value;
}

/**
 * The suffix to append to the listener key when it's a capture listener.
 */
const CAPTURE_SUFFIX = "__capture";

/**
 * Create a key for the element declaration listeners object.
 *
 * @remarks
 *
 * The key is used to store the listener declaration in the element declaration.
 *
 * The capture suffix is added when the listener is a capture listener.
 * Adding the capture suffix is necessary to differentiate between the capture and bubble phases,
 * because `removeEventListener` looks for the event type and capture option,
 * when removing a listener.
 */
export function createListenerDeclarationKey<E extends AnyProps = AnyProps>(
  declaration: ListenerDeclaration<E>,
): ElementDeclarationListenersKey {
  const { type, options } = declaration;

  if (options?.capture) {
    return `${type}${CAPTURE_SUFFIX}`;
  }

  return `${type}`;
}
