import { createRequestState } from "./RequestState.ts";

const dependencyInjectionState = createRequestState(true);

/**
 * Enables dependency injection for the request.
 *
 * @public
 */
export function enableDependencyInjection(request: Request): void {
  dependencyInjectionState.dissociate(request);
}

/**
 * Disables dependency injection for the request.
 *
 * @public
 */
export function disableDependencyInjection(request: Request): void {
  dependencyInjectionState.associate(request, false);
}

/**
 * Checks if dependency injection is enabled for the request.
 *
 * @public
 */
export function isDependencyInjectionEnabled(request: Request): boolean {
  return dependencyInjectionState.from(request);
}
