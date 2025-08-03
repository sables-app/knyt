/**
 * An object type where all properties must be set to either a value or `undefined`.
 *
 * @public
 */
export type OptionalAndComplete<T> = {
  [P in keyof Required<T>]: T[P] | undefined;
};

/**
 * Enforces that the given type is either `T` or `U`, but not both.
 */
export type XOR<T, U, V> = [T] extends [U]
  ? [T] extends [V]
    ? never
    : T
  : [T] extends [V]
    ? [T] extends [U]
      ? never
      : V
    : never;

/**
 * Enforces that the given type is either `null` or `undefined`, but not both.
 */
export type UndefinedXorNull<T> = XOR<T, undefined, null>;

/**
 * Extracts all property names of an object that are functions.
 *
 * @remarks
 *
 * This is useful for getting the names of methods in a class or object type.
 */
export type ObjectToFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * Omits all properties of an object where the key is a `symbol`.
 *
 * @remarks
 *
 * This is useful for removing properties that are not serializable or
 * not intended to be part of the public API of an object.
 *
 * @public
 */
export type OmitSymbolKeys<T> = {
  [K in keyof T as K extends symbol ? never : K]: T[K];
};
