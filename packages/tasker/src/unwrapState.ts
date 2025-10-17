import {
  normalizeReferenceUnwrappedArgs,
  unwrapRef,
  type Reference,
  type ReferenceUnwrapped,
} from "@knyt/artisan";

import type { ReactiveControllerHost } from "./ReactiveController.ts";
import { track } from "./tracking.ts";

/**
 * Creates a readonly reactive state reference derived from another reference.
 *
 * @alpha
 *
 * @deprecated Use `unwrapRef` instead.
 * This function is deprecated and will be removed in a future version.
 */
/*
 * ### Private Remarks
 *
 * The use of overload signatures is necessary for
 * type inference to work correctly.
 *
 * The `ReferenceDerive.Params` type is too complex
 * for TypeScript to infer the correct types by itself.
 */
export function unwrapState<T>(
  host: ReactiveControllerHost,
  origin: ReferenceUnwrapped.ParamsWithoutHandler<T>[0],
): Reference.Unwrapped<T | undefined>;

export function unwrapState<T, U>(
  host: ReactiveControllerHost,
  ...args: ReferenceUnwrapped.ParamsWithHandler<T, U>
): Reference.Unwrapped<T | undefined>;

export function unwrapState<T, U>(
  host: ReactiveControllerHost,
  options: ReferenceUnwrapped.OptionsWithFallback<T, U>,
): Reference.Unwrapped<T>;

export function unwrapState<T, U>(
  host: ReactiveControllerHost,
  options: ReferenceUnwrapped.Options<T, U>,
): Reference.Unwrapped<T | undefined>;

export function unwrapState<T, U>(
  host: ReactiveControllerHost,
  ...args: ReferenceUnwrapped.Args<T, U>
): Reference.Unwrapped<T | undefined> {
  const options = normalizeReferenceUnwrappedArgs<T, U>(args);
  const state = unwrapRef<T, U>(options);

  track(host, state);

  return state;
}
