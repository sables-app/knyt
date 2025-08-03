import {
  normalizeReferenceUnwrappedArgs,
  ReferenceUnwrapped,
} from "./ReferenceUnwrapped";
import type { Reference } from "./types";

/**
 * Unwrap a nested reference that may be `undefined`.
 *
 * @example
 *
 * ```ts
 * const str$ = ref("Hi");
 *
 * const nested$ = ref<Reference<string> | undefined>(undefined);
 *
 * // Type: Reference.Unwrapped<string | undefined>
 * const maybeStr$ = unwrapRef(nested$);
 * ```
 *
 * @alpha This API is experimental and may change in future releases without notice.
 */
export function unwrapRef<T>(
  origin: ReferenceUnwrapped.ParamsWithoutHandler<T>[0],
): Reference.Unwrapped<T | undefined>;

/**
 * Extracts an optional nested reference from a source reference.
 *
 * @example
 *
 * ```ts
 * type Foo = {
 *   bar$: Reference.Readonly<string>
 * };
 *
 * const foo$ = createReference<Foo | undefined>(undefined);
 *
 * // Type: Reference.Unwrapped<string | undefined>
 * const bar$ = unwrapRef(foo$, (foo) => foo.bar$);
 * ```
 *
 * @beta This API is experimental and may change in future releases without notice.
 */
/*
 * ### Private Remarks
 *
 * Overload signatures are used to ensure proper type inference.
 * The `ReferenceUnwrapped.Params` type is too complex for TypeScript
 * to infer correctly without them.
 */

export function unwrapRef<T, U>(
  ...args: ReferenceUnwrapped.ParamsWithFallback<T, U>
): Reference.Unwrapped<T>;

export function unwrapRef<T, U>(
  ...args: ReferenceUnwrapped.ParamsWithHandler<T, U>
): Reference.Unwrapped<T | undefined>;

export function unwrapRef<T, U>(
  options: ReferenceUnwrapped.OptionsWithFallback<T, U>,
): Reference.Unwrapped<T>;

export function unwrapRef<T, U>(
  options: ReferenceUnwrapped.Options<T, U>,
): Reference.Unwrapped<T | undefined>;

export function unwrapRef<T, U>(
  ...args: ReferenceUnwrapped.Args<T, U>
): Reference.Unwrapped<T | undefined> {
  return new ReferenceUnwrapped(normalizeReferenceUnwrappedArgs(args));
}
