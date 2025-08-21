import { CookieMap, type BunRequest, type RouterTypes } from "bun";

type BunRequestMixin<RoutePath extends string> = Omit<
  BunRequest<RoutePath>,
  keyof Request
>;

/**
 * Creates a `Request` with additional properties for the Bun runtime.
 *
 * @internal scope: workspace
 */
export function createBunRequest<RoutePath extends string = string>(
  input: RequestInfo | URL,
  params: RouterTypes.ExtractRouteParams<RoutePath>,
  bunRequestInit?: RequestInit & { cookies?: CookieMap },
): BunRequest<RoutePath> {
  const { cookies = new CookieMap(), ...requestInit } = bunRequestInit || {};
  const request = new Request(input, requestInit);
  const mixin: BunRequestMixin<RoutePath> = { params, cookies };

  return Object.assign(request, mixin) as BunRequest<RoutePath>;
}
