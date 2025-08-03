import {
  computeRef,
  normalizeComputeReferenceArgs,
  type Reference,
  type ReferenceCompute,
} from "@knyt/artisan";

import type { ReactiveControllerHost } from "./ReactiveController";
import { track } from "./tracking";

/**
 * Creates a readonly reactive state reference from a computed value
 * based on the given dependencies. When its value changes,
 * it updates the given host.
 *
 * @alpha
 * @deprecated Use `computeRef` instead.
 * This function is deprecated and will be removed in a future version.
 */
/*
 * ### Private Remarks
 *
 * The use of overload signatures is necessary for
 * type inference to work correctly.
 *
 * The `ReferenceCompute.Params` type is too complex
 * for TypeScript to infer the correct types by itself.
 *
 * @deprecated
 */
export function computeState<T, V extends any[]>(
  host: ReactiveControllerHost,
  options: ReferenceCompute.Options<T, V>,
): Reference.SubscriberRetaining<T>;

export function computeState<T, V extends any[]>(
  host: ReactiveControllerHost,
  ...params: ReferenceCompute.Params<T, V>
): Reference.SubscriberRetaining<T>;

export function computeState<T, V extends any[]>(
  host: ReactiveControllerHost,
  ...params: ReferenceCompute.Args<T, V>
): Reference.SubscriberRetaining<T> {
  const options = normalizeComputeReferenceArgs<T, V>(params);
  const state = computeRef<T, V>(options);

  track(host, state);

  return state;
}
