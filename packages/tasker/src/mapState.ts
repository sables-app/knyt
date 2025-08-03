import {
  isReferenceMappedCurryParams,
  mapRef,
  normalizeReferenceMappedArgs,
  type Reference,
  type ReferenceMapped,
} from "@knyt/artisan";

import type { ReactiveControllerHost } from "./ReactiveController";
import { track } from "./tracking";

/**
 * Creates a readonly reactive state reference from a transformed value
 * based on the given dependency. When its value changes,
 * it requests an update on the given host.
 *
 * @alpha
 *
 * @deprecated Use `mapRef` instead.
 * This function is deprecated and will be removed in a future version.
 */
/*
 * ### Private Remarks
 *
 * The use of overload signatures is necessary for
 * type inference to work correctly.
 *
 * The `ReferenceMapped.Params` type is too complex
 * for TypeScript to infer the correct types by itself.
 */
export function mapState<T, U>(
  host: ReactiveControllerHost,
  options: ReferenceMapped.Options<T, U>,
): Reference.SubscriberRetaining<T, U>;

export function mapState<T, U>(
  host: ReactiveControllerHost,
  ...params: ReferenceMapped.Params<T, U>
): Reference.SubscriberRetaining<T, U>;

export function mapState<T, U>(
  host: ReactiveControllerHost,
  ...params: ReferenceMapped.CurryParams<T, U>
): ReferenceMapped.CurriedFn<T, U>;

export function mapState<T, U>(
  host: ReactiveControllerHost,
  ...params: ReferenceMapped.Args<T, U>
): Reference.SubscriberRetaining<T, U> | ReferenceMapped.CurriedFn<T, U> {
  if (isReferenceMappedCurryParams(params)) {
    return (origin) => {
      const [transform] = params;

      return _mapState(host, { origin, transform });
    };
  }

  return _mapState(host, normalizeReferenceMappedArgs(params));
}

/**
 * The actual implementation of `mapState`.
 */
function _mapState<T, U>(
  host: ReactiveControllerHost,
  options: ReferenceMapped.Options<T, U>,
): Reference.SubscriberRetaining<T, U> {
  const state = mapRef<T, U>(options);

  track(host, state);

  return state;
}
