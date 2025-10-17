import type { Observable } from "@knyt/artisan";
import {
  bigintTransformers,
  booleanTransformers,
  createNumericTransformers,
  integerTransformers,
  numberTransformers,
  numericEqual,
  objectTransformers,
  shallowEqual,
} from "@knyt/artisan";
import {
  areStyleSheetMixinsEqual,
  areStyleSheetsEqual,
  StyleSheet,
  type StyleSheetMixin,
} from "@knyt/tailor";
import type { AnyProps, ElementBuilder, StyleObject } from "@knyt/weaver";

import type { AttributeName, PropertyDefinition, PropertyInfo } from "../types.ts";

/**
 * A builder for defining properties on an `KnytElement`.
 *
 * @internal scope: workspace
 */
/*
 * ### Private Remarks
 *
 * This is only exported to avoid the following error when using `defineProperty`:
 *
 * > TS7056: The inferred type of this node exceeds the maximum length
 * > the compiler will serialize. An explicit type annotation is needed.
 *
 * When this isn't exported, the inferred type from `PropertyBuilder` is
 * too large for the compiler to serialize.
 */
export class PropertyBuilder<in out B> implements PropertyDefinition<B> {
  /**
   * A string that describes the type of the property,
   * which is used for debugging purposes.
   */
  #logType = "unknown";

  /** @internal scope: workspace */
  declare Value: PropertyInfo.ToValue<B>;

  /** @internal scope: workspace */
  declare AttributeName: PropertyInfo.ToAttributeName<B>;

  /** @public */
  attributeName?: PropertyDefinition<B>["attributeName"];

  /** @public */
  toAttributeValue?: PropertyDefinition<B>["toAttributeValue"];

  /** @public */
  toPropertyValue?: PropertyDefinition<B>["toPropertyValue"];

  /** @public */
  comparator?: PropertyDefinition<B>["comparator"];

  /**
   * Sets the attribute name to which the property value will be reflected.
   *
   * @public
   */
  attribute<A extends AttributeName>(attributeName?: A) {
    this.attributeName = attributeName as any;

    return this as unknown as PropertyBuilder<{
      Value: PropertyInfo.ToValue<B>;
      AttributeName: A;
    }>;
  }

  /**
   * Sets the attribute name to which the property value will be reflected.
   *
   * @remarks
   *
   * Shorthand for calling `attribute()` method.
   *
   * @see {@link attribute}
   */
  attr<A extends AttributeName>(attributeName?: A) {
    return this.attribute(attributeName);
  }

  /**
   * Defines the property value as a string.
   *
   * @public
   */
  string<T extends string = string>() {
    this.#logType = "string";

    return this as unknown as PropertyBuilder<{
      Value: T;
      AttributeName: PropertyInfo.ToAttributeName<B>;
    }>;
  }

  /**
   * Defines the property value as a string.
   *
   * @remarks
   *
   * Shorthand for calling `string()` method.
   *
   * @see {@link string}
   * @public
   */
  get str() {
    return this.string();
  }

  /**
   * Defines the property value as a boolean.
   *
   * @remarks
   *
   * Sets up transformation functions for converting a boolean
   * property value to and from an attribute value.
   *
   * @public
   */
  boolean<T extends boolean = boolean>() {
    this.#logType = "boolean";

    Object.assign(this, booleanTransformers);

    return this as unknown as PropertyBuilder<{
      Value: T;
      AttributeName: PropertyInfo.ToAttributeName<B>;
    }>;
  }

  /**
   * Defines the property value as a boolean.
   *
   * @remarks
   *
   * Sets up transformation functions for converting a boolean
   * property value to and from an attribute value.
   *
   * Shorthand for calling `boolean()` method.
   *
   * @see {@link boolean}
   * @public
   */
  get bool() {
    return this.boolean();
  }

  /**
   * Defines the property value as a number.
   *
   * @remarks
   *
   * Sets up transformation functions for converting a number
   * property value to and from an attribute value.
   *
   * @public
   */
  number<T extends number = number>() {
    this.#logType = "number";

    Object.assign(this, numberTransformers);

    return this as unknown as PropertyBuilder<{
      Value: T;
      AttributeName: PropertyInfo.ToAttributeName<B>;
    }>;
  }

  /**
   * Defines the property value as a number.
   *
   * @remarks
   *
   * Sets up transformation functions for converting a number
   * property value to and from an attribute value.
   *
   * @remarks
   *
   * Shorthand for calling `number()` method.
   *
   * @see {@link number}
   * @public
   */
  get num() {
    return this.number();
  }

  /**
   * Defines the property value as an integer.
   *
   * @remarks
   *
   * Sets up transformation functions for converting a integer
   * property value to and from an attribute value.
   *
   * @public
   */
  integer<T extends number = number>() {
    this.#logType = "integer";

    Object.assign(this, integerTransformers);

    return this as unknown as PropertyBuilder<{
      Value: T;
      AttributeName: PropertyInfo.ToAttributeName<B>;
    }>;
  }

  /**
   * Defines the property value as an integer.
   *
   * @remarks
   *
   * Sets up transformation functions for converting a integer
   * property value to and from an attribute value.
   *
   * Shorthand for calling `integer()` method.
   *
   * @see {@link integer}
   * @public
   */
  get int() {
    return this.integer();
  }

  /**
   * Defines the property value as a bigint.
   *
   * @remarks
   *
   * Sets up transformation functions for converting a bigint
   * property value to and from an attribute value.
   *
   * @public
   */
  bigInteger<T extends bigint = bigint>() {
    this.#logType = "bigint";

    Object.assign(this, bigintTransformers);

    return this as unknown as PropertyBuilder<{
      Value: T;
      AttributeName: PropertyInfo.ToAttributeName<B>;
    }>;
  }

  /**
   * Defines the property value as a bigint.
   *
   * @remarks
   *
   * Sets up transformation functions for converting a bigint
   * property value to and from an attribute value.
   *
   * Shorthand for calling `bigInteger()` method.
   *
   * @see {@link bigint}
   * @public
   */
  get bigint() {
    return this.bigInteger();
  }

  /**
   * Defines the property value as a numeric object.
   *
   * @remarks
   *
   * Numeric values are those that can be converted to a number using
   * the `Number()` constructor. This includes objects with a `valueOf()`
   * method returning a number, or primitives convertible to numbers.
   * e.g. `Date`.
   *
   * Sets up transformation functions for converting a numeric property
   * value to and from an attribute value.
   *
   * @example
   *
   * ```ts
   * define.prop.numeric(Date);
   * ```
   *
   * @public
   */
  numeric<T>(Constructor: { new (value: number): T }) {
    this.#logType = "numeric";

    Object.assign(this, createNumericTransformers(Constructor));

    this.comparator = numericEqual;

    return this as unknown as PropertyBuilder<{
      Value: T;
      AttributeName: PropertyInfo.ToAttributeName<B>;
    }>;
  }

  /**
   * Defines the property value as a DOM element reference.
   *
   * @public
   */
  elementRef<T extends AnyProps>() {
    this.#logType = "elementRef";

    return this as unknown as PropertyBuilder<{
      Value: ElementBuilder.Ref<T>;
      AttributeName: PropertyInfo.ToAttributeName<B>;
    }>;
  }

  /**
   * Defines the property value as an observer.
   *
   * @public
   */
  /*
   * ### Private Remarks
   *
   * This shouldn't be names "subscriber", because that name implies
   * that a subscription is created, which is not the case.
   * An observer can be used to observe _anything_.
   */
  observer<T>() {
    this.#logType = "observer";

    return this as unknown as PropertyBuilder<{
      Value: Observable.Subscriber<T>;
      AttributeName: PropertyInfo.ToAttributeName<B>;
    }>;
  }

  /**
   * Defines the property value as a shallow object or array.
   *
   * @remarks
   *
   * Because this property is a shallow object, the `shallowEqual`
   * function is used to compare the property value with the previous value.
   * As a result, it should be used as the last method called in the chain.
   *
   * @alpha This is an experimental feature and may change in the future.
   */
  shallow<T extends Record<string, any>>() {
    this.#logType = "shallow";

    Object.assign(this, objectTransformers);

    // Type cast to avoid unhelpful error message.
    this.comparator = shallowEqual as any;

    return this as unknown as PropertyDefinition<{
      Value: T;
      AttributeName: PropertyInfo.ToAttributeName<B>;
    }>;
  }

  /**
   * Defines the property value as a style object.
   *
   * @remarks
   *
   * Because this property is a shallow object, the `shallowEqual`
   * function is used to compare the property value with the previous value.
   * As a result, it should be used as the last method called in the chain.
   */
  styleObject<T extends StyleObject>() {
    this.#logType = "styleObject";

    return this.shallow<T>();
  }

  /**
   * Defines the property value as a style sheet.
   *
   * @remarks
   *
   * Because this property sets a comparator function,
   * it should be used as the last method called in the chain.
   */
  styleSheet<T extends StyleSheet<any>>() {
    this.#logType = "styleSheet";

    // Type cast to avoid unhelpful error message.
    this.comparator = areStyleSheetsEqual as any;

    return this as unknown as PropertyDefinition<{
      Value: T;
      AttributeName: false;
    }>;
  }

  /**
   * Defines the property value as a style sheet mixin.
   *
   * @remarks
   *
   * Because this property sets a comparator function,
   * it should be used as the last method called in the chain.
   *
   * @alpha This is an experimental feature and may change in the future.
   */
  styleSheetMixin<T extends StyleSheetMixin>() {
    this.#logType = "styleSheetMixin";

    Object.assign(this, objectTransformers);

    // Type cast to avoid unhelpful error message.
    this.comparator = areStyleSheetMixinsEqual as any;

    return this as unknown as PropertyDefinition<{
      Value: T;
      AttributeName: PropertyInfo.ToAttributeName<B>;
    }>;
  }

  /**
   * Sets the property's comparator function.
   *
   * @remarks
   *
   * This is used to compare the property value with the previous value.
   * It should be used as the last method called in the chain.
   */
  equality(comparator: PropertyDefinition<B>["comparator"]) {
    this.comparator = comparator;

    return this as unknown as PropertyDefinition<B>;
  }

  get [Symbol.toStringTag]() {
    return `[PropertyBuilder: ${this.#logType}${this.attributeName ? `, ${this.attributeName}` : ""}]`;
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this[Symbol.toStringTag];
  }
}

/**
 * Defines a reactive property, optionally with an attribute name to reflect
 * the property value.
 *
 * @remarks
 *
 *
 * Commonly used for properties and attributes on `KnytElement` instances or
 * Knyt Glazier includes.
 *
 * @public
 */
// TODO: Consider adding an overload to support providing a type constructor.
export function defineProperty<T = unknown>() {
  const propertyBuilder = new PropertyBuilder<{
    Value: T;
    AttributeName: false;
  }>();

  // Disable attribute integration by default.
  propertyBuilder.attributeName = false;

  return propertyBuilder;
}
