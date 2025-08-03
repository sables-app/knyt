import { BasicAssociationMap, type AssociationMap } from "@knyt/artisan";

/**
 * An object that associates a value with a request. This is useful for
 * storing request-specific data that can be accessed later in the request
 * lifecycle.
 */
export type RequestState<T> = AssociationMap<Request, T>;

/**
 * Create a RequestState instance.
 *
 * @see {@link RequestState}
 *
 * @remarks
 *
 * Create a RequestState instance with an optional fallback value. The fallback value
 * is used when the request does not have an associated value. If no fallback value is
 * provided, the default value is undefined.
 */
export function createRequestState<T>(fallback: T): RequestState<T>;
export function createRequestState<T>(): RequestState<T | undefined>;
export function createRequestState<T>(
  fallback?: T,
): RequestState<T | undefined> {
  return new BasicAssociationMap<Request, T>(fallback);
}
