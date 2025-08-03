/**
 * A type representing the mutability of a type.
 *
 * @see {@link Mut}
 */
export type Mut = Mut.ReadonlyMode | Mut.MutableMode;

/**
 * A collection of utility types for enforcing mutability modes.
 *
 * @remarks
 *
 * This allows for fine-grained control over the mutability of the entire contents
 * of a type, including nested properties.
 *
 * @example
 *
 * ```ts
 * type User<M extends Mut = Mut.ReadonlyMode> = {
 *   name: "John Doe";
 *   age: 30;
 *   isActive: true;
 *   // The `friends` property is `readonly` by default,
 *   // but the `Reference` object itself is mutable,
 *   // allowing replacement of the internal array, which is `readonly` by default.
 *   friends: Reference<Mut.ArrayOf<string, M>>;
 *   tags: Mut.SetOf<string, M>;
 * };
 *
 * type UserCollection<M extends Mut = Mut.ReadonlyMode> = Mut.ArrayOf<User<M>, M>;
 *
 * // The `users` array is mutable, allowing for adding and removing users.
 * const users: UserCollection<"mutable"> = [];
 *
 * users.push({
 *   name: "John Doe",
 *   age: 30,
 *   isActive: true,
 *   friends: ref(["Alice", "Bob"]),
 *   tags: new Set(["friend", "colleague"]),
 * });
 *
 * // And then when you want to make it readonly, you can do so by using the `"readonly"` mode.
 * const readonlyUsers: UserCollection<"readonly"> = users;
 * ```
 */
export namespace Mut {
  /**
   * A mutability mode that enforces read-only constraints on the type.
   *
   * @see {@link Mut}
   */
  export type ReadonlyMode = "readonly";

  /**
   * A mutability mode that allows for a type to be mutable.
   *
   * @see {@link Mut}
   */
  export type MutableMode = "mutable";

  /**
   * An `Array` type that supports mutability modes.
   *
   * @see {@link Mut}
   */
  export type ArrayOf<T, M extends Mut> = M extends ReadonlyMode
    ? ReadonlyArray<T>
    : Array<T>;

  /**
   * A `Record` type that supports mutability modes.
   *
   * @see {@link Mut}
   */
  export type RecordOf<
    K extends keyof any,
    T,
    M extends Mut,
  > = M extends ReadonlyMode ? Readonly<Record<K, T>> : Record<K, T>;

  /**
   * A `Map` type that supports mutability modes.
   *
   * @see {@link Mut}
   */
  export type MapOf<K, V, M extends Mut> = M extends ReadonlyMode
    ? ReadonlyMap<K, V>
    : Map<K, V>;

  /**
   * A `Set` type that supports mutability modes.
   *
   * @see {@link Mut}
   */
  export type SetOf<T, M extends Mut> = M extends ReadonlyMode
    ? ReadonlySet<T>
    : Set<T>;

  /**
   * Enforces a given mutability mode on properties.
   */
  export type PropsOf<T, M extends Mut> = M extends ReadonlyMode
    ? Readonly<T>
    : T;
}
