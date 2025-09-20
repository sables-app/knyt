import { BasicAssociationMap, type AssociationMap } from "@knyt/artisan";
import type { BunRequest } from "bun";

/**
 * A union type of `Request` and `BunRequest` to accommodate different environments.
 *
 * @public
 */
// This type is necessary, because just using `Request` breaks
// when other dependencies attach their own `Request` type to the global scope.
// For example, Cloudflare Worker's Wrangler does this... annoying AF 😑.
export type AnyRequest = Request | BunRequest;

/**
 * An object that associates a value with a request. This is useful for
 * storing request-specific data that can be accessed later in the request
 * lifecycle.
 *
 * @public
 */
export type RequestState<T> = AssociationMap<AnyRequest, T>;

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
 *
 * @public
 */
export function createRequestState<T>(fallback: T): RequestState<T>;
export function createRequestState<T>(): RequestState<T | undefined>;
export function createRequestState<T>(
  fallback?: T,
): RequestState<T | undefined> {
  return new BasicAssociationMap<AnyRequest, T>(fallback);
}
