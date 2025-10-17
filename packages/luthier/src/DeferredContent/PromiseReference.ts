import type { Reference } from "@knyt/artisan";

import type { SkipRenderSignal } from "./SkipRenderSignal.ts";

/**
 * A type representing a reference that holds a Promise, or may be undefined.
 *
 * @remarks
 *
 * This type is a union of two reference types to accommodate both cases:
 * - a reference to a possibly `undefined` promise
 * - a reference to a definitely defined promise
 *
 * This is necessary because TypeScript does not allow a single reference type
 * to represent both cases within the `Reference` type.
 */
export type PromiseReference<T> =
  // A reference that may hold a promise or undefined
  | Reference.Readonly<Promise<T | typeof SkipRenderSignal> | undefined>
  // A reference that holds a promise
  | Reference.Readonly<Promise<T | typeof SkipRenderSignal>>;

export namespace PromiseReference {
  /**
   * The unwrapped type of a `PromiseReference`.
   *
   * @remarks
   *
   * If the reference holds a `Promise<U>` or `Promise<U> | undefined`,
   * the unwrapped type is `U`. Otherwise, it is `never`.
   *
   * This type is a union of two conditional types to handle both cases.
   * This is necessary because TypeScript does not allow a single conditional type
   * to extract the inner type from both `Promise<U>` and `Promise<U> | undefined`.
   */
  export type Unwrapped<T> =
    // Check if T is a Reference holding a Promise
    T extends Reference.Readonly<Promise<infer U | typeof SkipRenderSignal>>
      ? U
      : // Check if T is a Reference holding a Promise or undefined
        T extends Reference.Readonly<
            Promise<infer U | typeof SkipRenderSignal> | undefined
          >
        ? U | undefined
        : never;

  /**
   * A tuple type representing multiple `PromiseReference` types.
   */
  export type Collection<T> = [...refs: PromiseReference<T>[]];

  export namespace Collection {
    /**
     * The unwrapped types of a tuple of `PromiseReference` types.
     */
    export type Unwrapped<T extends readonly unknown[]> = {
      [K in keyof T]: PromiseReference.Unwrapped<T[K]>;
    };
  }
}
