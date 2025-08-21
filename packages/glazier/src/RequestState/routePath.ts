import { createRequestState } from "./RequestState";

/**
 * @internal scope: workspace
 */
export const routePathState = createRequestState<string>();

/**
 * Retrieves the route path associated with the request.
 */
export function getRoutePath(request: Request): string | undefined {
  return routePathState.from(request);
}
