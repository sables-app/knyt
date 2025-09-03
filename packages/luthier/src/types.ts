import type { ToAttributeValue, ToPropertyValue } from "@knyt/artisan";
import type {
  AnyProps,
  AttributeDictionary,
  ElementBuilder,
  InferElementProps,
  View,
} from "@knyt/weaver";

import type { KnytElement } from "./KnytElement";

export type PropertyName = string | symbol;
export type AttributeName = string | undefined | false;

export type ContainerRefValue =
  | HTMLElement
  | DocumentFragment
  | ShadowRoot
  | null;

export type ReactiveProperty = PropertyDefinition.WithPropertyName<
  PropertyInfo<any, any>
>;

export type ReactiveProperties = ReactiveProperty[];

/**
 * @public
 */
export type PropertyDefinition<B> = {
  /**
   * ### Private Remarks
   *
   * This property only exists as a declaration and is only used for easier type inference.
   *
   * @internal scope: workspace
   */
  Value: PropertyInfo.ToValue<B>;
  /*
   * ### Private Remarks
   *
   * This property only exists as a declaration and is only used for easier type inference.
   *
   * @internal scope: workspace
   */
  AttributeName: PropertyInfo.ToAttributeName<B>;
  /**
   * A function to compare two property values to determine if they are equal.
   *
   * Defaults to a strict equality check (`===`) if not provided.
   */
  // TODO: Rename for clarity
  comparator?: (
    a?: PropertyInfo.ToValue<B>,
    b?: PropertyInfo.ToValue<B>,
  ) => boolean;
  attributeName?: PropertyInfo.ToAttributeName<B>;
  toAttributeValue?: ToAttributeValue<PropertyInfo.ToValue<B>>;
  toPropertyValue?: ToPropertyValue<PropertyInfo.ToValue<B>>;
};

export namespace PropertyDefinition {
  export type ToValue<T> =
    T extends PropertyDefinition<infer B> ? PropertyInfo.ToValue<B> : unknown;

  export type ToAttributeName<T> =
    T extends PropertyDefinition<infer B>
      ? PropertyInfo.ToAttributeName<B>
      : never;

  export namespace ToAttributeName {
    export type Valid<T> =
      T extends PropertyDefinition<infer B>
        ? PropertyInfo.ToAttributeName.Valid<B>
        : never;
  }

  export type ToAttributeValue<T> =
    T extends PropertyDefinition<infer B>
      ? PropertyInfo.ToAttributeValue<B>
      : never;

  export type WithPropertyName<
    B,
    K extends PropertyName = PropertyName,
  > = PropertyDefinition<B> & {
    propertyName: K;
  };

  export type FromValue<
    T,
    A extends AttributeName = false,
  > = PropertyDefinition<PropertyInfo<T, A>>;
}

/**
 * @public
 */
export type PropertyInfo<T, A extends AttributeName> = {
  Value: T;
  AttributeName: A;
};

export namespace PropertyInfo {
  export type ToValue<T> = T extends PropertyInfo<infer V, any> ? V : never;

  export type ToAttributeName<T> =
    T extends PropertyInfo<any, infer A> ? A : never;

  export namespace ToAttributeName {
    export type Valid<T> =
      T extends PropertyInfo<any, infer A>
        ? A extends string
          ? A
          : never
        : never;
  }

  export type ToAttributeValue<T> =
    T extends PropertyInfo<infer V, any>
      ? V extends boolean
        ? boolean
        : string | null
      : never;
}

/**
 * This is unused type and is here for reference.
 *
 * This is the expected value for the `PropertiesDefinition` generic type.
 *
 * It's not used in the code, because this type is intended to be inferred
 * by the compiler, but not explicitly defined.
 */
type __PropertyInfoDictionary__ = Record<
  string,
  PropertyInfo<any, AttributeName>
>;

export type PropertiesDefinition<PropInfoDict> = {
  [K in keyof PropInfoDict]: PropInfoDict[K] extends PropertyInfo<any, any>
    ? PropertyDefinition<PropInfoDict[K]>
    : PropInfoDict[K] extends PropertyDefinition<any>
      ? PropInfoDict[K]
      : never;
};

export namespace PropertiesDefinition {
  export type ToAttributes<T> =
    T extends PropertiesDefinition<infer B>
      ? {
          [K in keyof B as PropertyInfo.ToAttributeName.Valid<B[K]>]:
            | PropertyInfo.ToAttributeValue<B[K]>
            | undefined;
        }
      : T extends Record<string, PropertyDefinition<any>>
        ? {
            [K in keyof T as PropertyDefinition.ToAttributeName.Valid<
              T[K]
            >]: T[K] extends PropertyDefinition<infer I>
              ? PropertyInfo.ToAttributeValue<I> | undefined
              : never;
          }
        : never;

  export type ToProps<T> =
    T extends PropertiesDefinition<infer B>
      ? {
          [K in keyof B]: B[K] extends PropertyInfo<infer V, any>
            ? V | undefined
            : never;
        }
      : T extends Record<string, PropertyDefinition<any>>
        ? {
            [K in keyof T]: T[K] extends PropertyDefinition<infer I>
              ? PropertyInfo.ToValue<I> | undefined
              : never;
          }
        : never;

  /**
   * Infers a `PropertyInfoDictionary` from a given set of props.
   *
   * This type is primarily used to verify that a `PropertiesDefinition` is correct.
   * It should not be used to define a `PropertiesDefinition`, as it does not infer attribute names.
   *
   * @remarks
   *
   * Useful for resolving `TS7056` errors, where TypeScript encounters:
   *
   * > TS7056: The inferred type of this node exceeds the maximum length the
   * compiler will serialize. An explicit type annotation is needed.
   *
   * To resolve:
   * 1. Define a type for the expected props.
   * 2. Have the class implement the expected props type.
   * 3. Use `satisfies` to check if the `PropertiesDefinition` matches the expected props.
   *
   * @example
   * ```ts
   * type MyProps = {
   *   foo?: string;
   * };
   *
   * class MyElement extends KnytElement implements MyProps {
   *   static properties = {
   *     foo: define.property().string().attribute("foo"),
   *   } satisfies PropertiesDefinition.FromProps<MyProps>;
   *
   *   declare foo?: string;
   * }
   * ```
   */
  export type FromProps<T, A extends AttributeName = AttributeName> = {
    [K in keyof T]: PropertyInfo<T[K], A>;
  };
}

/**
 * @internal scope: workspace
 */
export type HTMLElementConstructor<E extends HTMLElement = HTMLElement> =
  new () => E;

/**
 * A definition for a custom element.
 *
 * @public
 */
/*
 * ### Private Remarks
 *
 * !!! Ensure consistency with the `LazyElementDefinition` type.
 */
export type ElementDefinition<
  T extends KnytElement.Constructor.Unknown,
  U extends string,
  P extends AnyProps = InstanceType<T>,
  A extends AttributeDictionary = KnytElement.ToAttributes<T>,
> = ElementDefinition.Fn<P> & ElementDefinition.Static<T, U, A>;

export namespace ElementDefinition {
  /**
   * @internal scope: workspace
   *
   * @returns A builder for declaring the HTML element using properties.
   */
  export type Fn<P extends AnyProps> = () => ElementBuilder.DOM<P>;

  /**
   * Static properties of an element definition for a `KnytElement`.
   *
   * @internal scope: workspace
   */
  export type Static<
    TConstructor extends KnytElement.Constructor.Unknown,
    TTagName extends string,
    TAttributes extends
      AttributeDictionary = KnytElement.ToAttributes<TConstructor>,
  > = BaseStatic<TConstructor, TTagName, TAttributes>;

  /**
   * Static properties of an element definition.
   *
   * @internal scope: module
   */
  export type BaseStatic<
    TConstructor extends HTMLElementConstructor,
    TTagName extends string,
    TAttributes extends AttributeDictionary = AttributeDictionary,
  > = {
    /**
     * @returns A builder for declaring the HTML element using attributes.
     */
    readonly html: () => ElementBuilder.HTML<TAttributes>;
    /**
     * The constructor of the custom element.
     */
    readonly Element: TConstructor;
    /**
     * The tag name of the custom element.
     */
    readonly tagName: TTagName;
    /**
     * @internal scope: workspace
     */
    readonly __isKnytElementDefinition: true;
  };

  /**
   * @internal scope: workspace
   */
  export type ToStatic<T> =
    T extends ElementDefinition<infer T, infer U, any, infer A>
      ? Static<T, U, A>
      : never;

  /**
   * An unknown element definition.
   *
   * @internal scope: workspace
   */
  export type Unknown = ElementDefinition<
    KnytElement.Constructor.Unknown,
    string,
    AnyProps,
    AttributeDictionary
  >;

  export type FromPropertiesDefinition<
    TN extends string,
    PD extends PropertiesDefinition<any>,
  > = ElementDefinition<
    KnytElement.Constructor.FromPropertiesDefinition<PD>,
    TN
  >;

  export type ToConstructor<T extends ElementDefinition<any, any, any, any>> =
    T extends ElementDefinition<infer TConstructor, any, any, any>
      ? TConstructor
      : never;

  /**
   * A definition for an element that is not a `KnytElement`.
   *
   * @public
   */
  export type Arbitrary<
    T extends HTMLElementConstructor,
    U extends string,
    P extends AnyProps = InstanceType<T>,
    A extends AttributeDictionary = AttributeDictionary,
  > = ElementDefinition.Fn<P> & ElementDefinition.BaseStatic<T, U, A>;

  export namespace Arbitrary {
    /** @internal scope: workspace */
    export type ToProps<T extends Arbitrary<any, any, any, any>> =
      T extends Arbitrary<any, any, infer P, any> ? P : never;
  }
}

/**
 * Infers reactive props from either a:
 *
 * - `PropertiesDefinition`
 * - `ElementDefinition`
 * - `ElementDefinition.Arbitrary`
 * - `KnytElement` constructor
 * - `View`
 *
 * @remarks
 *
 * To clarify, this type only infers reactive properties.
 * It does not infer all of the implied properties of a
 * an `HTMLElement`.
 *
 * @public
 */
/*
 * ### Private Remarks
 *
 * This type is intended for external, public use; similar to the
 * `ComponentProps` type in React. Other types, that're similar
 * to this one are used internally, but are not intended for
 * public use.
 */
// prettier-ignore
export type InferProps<T> =
  // The View type needs to be first in the union
  // because it is the most generic type and will match
  // other types.
  T extends View<infer P> ? P :
  T extends KnytElement.Constructor.Unknown ? InferProps.ElementConstructor<T> :
  T extends ElementDefinition<KnytElement.Constructor.Unknown,any,any,any> ? InferProps.ElementConstructor<ElementDefinition.ToConstructor<T>> :
  T extends ElementDefinition.Arbitrary<any,any,any,any> ? InferProps.ElementConstructor.Arbitrary<T> :
  T extends PropertiesDefinition<any> ? Partial<PropertiesDefinition.ToProps<T>> :
  never;

export namespace InferProps {
  /** @internal scope: workspace */
  export type ElementConstructor<T extends KnytElement.Constructor.Unknown> =
    Partial<
      PropertiesDefinition.ToProps<
        KnytElement.Constructor.ToPropertiesDefinition<T>
      >
    >;

  export namespace ElementConstructor {
    /** @internal scope: workspace */
    export type Arbitrary<
      T extends ElementDefinition.Arbitrary<any, any, any, any>,
    > = Partial<ElementDefinition.Arbitrary.ToProps<T>>;
  }

  /** @internal scope: workspace */
  export type HTML<T> = InferElementProps.HTML<T>;
  /** @internal scope: workspace */
  export type SVG<T> = InferElementProps.SVG<T>;
  /** @internal scope: workspace */
  export type DOM<T> = InferElementProps.DOM<T>;
}
