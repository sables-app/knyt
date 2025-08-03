/**
 * A DOM attribute value as returned by `getAttribute`.
 */
export type DOMAttributeValue = string | null;

export type ToPropertyValue<T> = (
  attributeValue: DOMAttributeValue,
) => T | undefined;

// TODO: Add `booleans` as valid return type, but don't change the `DOMAttributeValue` type
export type ToAttributeValue<T> = (propertyValue: T) => DOMAttributeValue;

export const unknownToAttributeValue = function unknownToAttributeValue(
  propertyValue?: unknown,
): DOMAttributeValue {
  return propertyValue == null ? null : String(propertyValue);
} satisfies ToAttributeValue<unknown>;

export const attributeValueToString = function attributeValueToString(
  attributeValue: DOMAttributeValue,
): string | undefined {
  return attributeValue === null ? undefined : attributeValue;
} satisfies ToPropertyValue<string>;

export const stringToAttributeValue = function stringToAttributeValue(
  propertyValue?: string,
): DOMAttributeValue {
  return propertyValue === undefined ? null : propertyValue;
} satisfies ToAttributeValue<string>;

export const attributeValueToBoolean = function attributeValueToBoolean(
  attributeValue: DOMAttributeValue,
): boolean | undefined {
  return attributeValue !== null && attributeValue !== "false";
} satisfies ToPropertyValue<boolean>;

export const booleanToAttributeValue = function booleanToAttributeValue(
  propertyValue?: boolean,
): DOMAttributeValue {
  return propertyValue ? "" : null;
} satisfies ToAttributeValue<boolean>;

export const attributeValueToInteger = function attributeValueToInteger(
  attributeValue: DOMAttributeValue,
) {
  return attributeValue === null ? undefined : parseInt(attributeValue, 10);
} satisfies ToPropertyValue<number>;

export const integerToAttributeValue = function integerToAttributeValue(
  propertyValue?: number,
): DOMAttributeValue {
  return propertyValue === undefined ? null : String(propertyValue);
} satisfies ToAttributeValue<number>;

export const numberTransformers = {
  toAttributeValue: (propertyValue?: number): DOMAttributeValue => {
    return propertyValue === undefined ? null : String(propertyValue);
  },
  toPropertyValue: (attributeValue: DOMAttributeValue) => {
    return attributeValue === null ? undefined : Number(attributeValue);
  },
} as const;

export const integerTransformers = {
  toAttributeValue: integerToAttributeValue,
  toPropertyValue: attributeValueToInteger,
} as const;

export const attributeValueToBigint = function attributeValueToInteger(
  attributeValue: DOMAttributeValue,
) {
  return attributeValue === null ? undefined : BigInt(attributeValue);
} satisfies ToPropertyValue<bigint>;

export const bigintToAttributeValue = function integerToAttributeValue(
  propertyValue?: bigint,
): DOMAttributeValue {
  return propertyValue === undefined ? null : String(propertyValue);
} satisfies ToAttributeValue<bigint>;

export const bigintTransformers = {
  toAttributeValue: bigintToAttributeValue,
  toPropertyValue: attributeValueToBigint,
} as const;

export const objectTransformers = {
  toAttributeValue: (value?: Record<string, any>): DOMAttributeValue => {
    return value === undefined ? null : JSON.stringify(value);
  },
  toPropertyValue: (value: DOMAttributeValue) => {
    return typeof value === "string" ? JSON.parse(value) : undefined;
  },
} as const;

export const booleanTransformers = {
  toAttributeValue: booleanToAttributeValue,
  toPropertyValue: attributeValueToBoolean,
} as const;

export function createNumericTransformers<T>(Constructor: {
  new (value: number): T;
}) {
  const toPropertyValue = function toPropertyValue(
    attributeValue: DOMAttributeValue,
  ) {
    return attributeValue === null
      ? undefined
      : new Constructor(Number(attributeValue));
  } satisfies ToPropertyValue<T>;

  const toAttributeValue = function toAttributeValue(
    propertyValue?: T,
  ): DOMAttributeValue {
    return propertyValue === undefined ? null : String(Number(propertyValue));
  } satisfies ToAttributeValue<T>;

  return {
    toAttributeValue,
    toPropertyValue,
  } as const;
}

export function stringOrBooleanToAttributeValue(
  propertyValue?: string | boolean,
): DOMAttributeValue {
  return typeof propertyValue === "boolean"
    ? booleanToAttributeValue(propertyValue)
    : stringToAttributeValue(propertyValue);
}

// const dateTransformers = createNumericTransformers(Date);

// export const attributeValueToDate =
//   dateTransformers.toPropertyValue satisfies PropertyValueTransformer<Date>;
// export const dateToAttributeValue =
//   dateTransformers.toAttributeValue satisfies AttributeValueTransformer<Date>;
