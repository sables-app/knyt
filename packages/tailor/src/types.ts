import type { StyleObject } from "@knyt/weaver";

import type { StyleSheet } from "./StyleSheet.ts";

type CSSSelector = string;

// TODO: Convert all rule name generics (`N extends string`) to css rule generics (`T extends CSSRules<string>`)

export type SerializedName = string;

export type SerializedNamesByRuleName<N extends string> = Partial<
  Record<N, SerializedName>
>;

export type SelectorCreator<N extends string> = (
  names: ClassNameDictionary<N>,
) => CSSSelector;

export type CSSRuleDescriptor<N extends string> = {
  selector: CSSRuleDescriptor.Selector<N>;
  styles: StyleObject;
};

export namespace CSSRuleDescriptor {
  export type Selector<N extends string> = SelectorCreator<N> | CSSSelector;
}

export type KnytCSSRuleInput<N extends string> =
  | StyleObject
  | CSSRuleDescriptor<N>;

/**
 * Internal type for CSS rules.
 *
 * @remarks
 *
 * Use `StyleSheet.Rules` instead of this type.
 *
 * @internal scope: workspace
 */
export type CSSRules<N extends string> = {
  readonly [K in N]: KnytCSSRuleInput<N>;
};

export namespace CSSRules {
  export type ToRuleName<T> = T extends CSSRules<string> ? keyof T : never;
}

export namespace RuleName {
  export type FromStyleSheet<T> =
    T extends StyleSheet<infer U> ? CSSRules.ToRuleName<U> : never;
}

/**
 * A dictionary of class names by rule name.
 *
 * @public
 */
/*
 * ### Private Remarks
 *
 * This should be an object literal that can be safety enumerated.
 */
export type ClassNameDictionary<N extends string> = {
  readonly [K in N]: SerializedName;
};

export namespace ClassNameDictionary {
  export type FromRules<T> = {
    [K in keyof T]: SerializedName;
  };
}

/**
 * An dictionary of CSS objects that can be mixin into an existing stylesheet.
 */
export type StyleSheetMixin<N extends string = string> = Partial<
  Record<N, StyleObject>
>;

export namespace StyleSheetMixin {
  export type FromRules<T> = {
    [K in keyof T]?: StyleObject;
  };
}

/**
 * A hash of a CSS object using a MurmurHash algorithm
 *
 * @see https://github.com/garycourt/murmurhash-js
 */
export type CSSObjectHash = string;

/**
 * A CSS declaration block
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/CSS_Declaration_Block | MDN Reference}
 */
export type CSSDeclarationBlock = string;

/**
 * A serialized CSS object
 */
export type SerializedCSSObject = {
  hash: CSSObjectHash;
  declarationBlock: CSSDeclarationBlock;
};

/**
 * Any string that can be used in a CSS context.
 *
 * @internal scope: workspace
 */
export type CSSString = string;

/**
 * An object that can be serialized to a CSS string.
 *
 * @remarks
 *
 * This is used to represent CSS objects that can be included in a stylesheet.
 * It can be a `StyleSheet`, an `Animation`, or any other object that has a `toCSSString` method.
 *
 * @public
 */
export type CSSSerializable = {
  // TODO: Add optional `document` parameter to support serialization in a specific document context.
  toCSSString(): CSSString;
};

/**
 * Recognized CSS to be included a the stylesheet.
 *
 * @public
 */
export type CSSInclude = CSSString | CSSSerializable | CSSStyleSheet;

/**
 * A CSS length value.
 *
 * @public
 *
 * @example
 *
 * "100px"
 * "100%"
 * "100em"
 */
/*
 * ### Private Remarks
 *
 * This type exists, because the `csstype` package doesn't
 * provide a type for CSS lengths.
 */
// TODO: Add `CSSLength` class
// TODO: Consider adding `CSSLength` as a valid property value for the `StyleObject` type
export type CSSDataTypeLength = (string & {}) | 0;
