const SYMBOL_NAMESPACE = "knyt.weaver";

/**
 * Used to denote a `Fragment` in an `ElementDeclaration`.
 *
 * @internal scope: package
 */
export const FragmentTypeSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.fragmentType`,
);

/**
 * Used to assign an `ElementDeclaration` to a `Element`.
 *
 * @remarks
 *
 * Element built by the `build` function will have this symbol
 * as a property and an `ElementDeclaration` as a value.
 *
 * @internal scope: package
 */
export const ElementDeclarationAttachmentSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.elementDeclarationAttachment`,
);

/**
 * Used to denote a DOMBuilder
 *
 * @internal scope: package
 */
export const ElementBuilderDomHTMLSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.elementBuilderDom`,
);

/**
 * Used to denote a SVGBuilder
 * @deprecated SVG is only supported in the `Markup` builder.
 * @internal scope: package
 */
export const ElementBuilderDomSVGSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.elementBuilderDomSVG`,
);

/**
 * Used to denote a HTMLRenderer
 *
 * @internal scope: package
 */
export const ElementBuilderMarkupHTMLSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.elementBuilderHTMLMarkup`,
);

/**
 * Used to denote a HTMLRenderer
 *
 * @internal scope: package
 */
export const ElementBuilderMarkupSVGSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.elementBuilderMarkupSVG`,
);

/**
 *
 * @internal scope: package
 */
export const ElementBuilderKindSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.elementBuilderKind`,
);

/**
 * Used to extract the element declaration from an `ElementBuilder`.
 *
 * @internal scope: package
 */
export const ElementBuilderTargetSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.elementBuilderTarget`,
);

/**
 * Used to extract the `ViewDeclaration` from an `ViewBuilder`.
 *
 * @internal scope: package
 */
export const ViewBuilderTargetSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.viewBuilderTarget`,
);

/**
 *
 * @internal scope: package
 */
export const ElementBuilderIsElementSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.elementBuilderIsElement`,
);

/**
 *
 * @internal scope: package
 */
export const ViewBuilderIsViewSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.viewBuilderIsView`,
);

/**
 * Used to denote an `ElementDeclaration`.
 *
 * @internal scope: package
 */
export const ElementDeclarationSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.elementDeclaration`,
);

/**
 * Used to denote a `View`.
 *
 * @internal scope: package
 */
export const ViewSymbol = Symbol.for(`${SYMBOL_NAMESPACE}.view`);

/**
 * Used to denote an `ViewDeclaration`.
 *
 * @internal scope: package
 */
export const ViewDeclarationSymbol = Symbol.for(
  `${SYMBOL_NAMESPACE}.viewDeclaration`,
);

export enum ElementDeclarationKind {
  DomHTML = "DomHTML",
  /** @deprecated SVG is only supported in the `Markup` builder. */
  DomSVG = "DomSVG",
  MarkupHTML = "MarkupHTML",
  MarkupSVG = "MarkupSVG",
}

export const ElementDeclarationKindBySymbol: Record<
  symbol,
  ElementDeclarationKind
> = {
  [ElementBuilderDomHTMLSymbol]: ElementDeclarationKind.DomHTML,
  /** @deprecated SVG is only supported in the `Markup` builder. */
  [ElementBuilderDomSVGSymbol]: ElementDeclarationKind.DomSVG,
  [ElementBuilderMarkupHTMLSymbol]: ElementDeclarationKind.MarkupHTML,
  [ElementBuilderMarkupSVGSymbol]: ElementDeclarationKind.MarkupSVG,
};

/**
 * The dataset property used to store the key of an element.
 */
/*
 * ### Private Remarks
 *
 * The value should be an all lowercase, alphanumeric string,
 * for consistency between using the `dataset` property and
 * the `getAttribute` method.
 */
export const KEY_DATASET_PROPERTY = "knytkey";

/**
 * The attribute used to store the key of an element.
 *
 * @public
 *
 * @remarks
 *
 * The `getElementDeclarationKey` function can be used to retrieve
 * the key of an element.
 *
 * @see getElementDeclarationKey
 */
export const KEY_ATTRIBUTE = `data-${KEY_DATASET_PROPERTY}`;

export enum ListenerModifier {
  Stop = "stop",
  Prevent = "prevent",
  Self = "self",
  Capture = "capture",
  Once = "once",
  Passive = "passive",
}
