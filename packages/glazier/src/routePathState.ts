import { createRequestState } from "./RequestState";

/**
 * @internal scope: workspace
 */
export const routePathState = createRequestState<string>();

export function getRoutePath(request: Request): string | undefined {
  return routePathState.from(request);
}
