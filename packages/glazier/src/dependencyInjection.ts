import { createRequestState } from "./RequestState";

const dependencyInjectionState = createRequestState(true);

export function enableDependencyInjection(request: Request): void {
  dependencyInjectionState.dissociate(request);
}

export function disableDependencyInjection(request: Request): void {
  dependencyInjectionState.associate(request, false);
}

export function isDependencyInjectionEnabled(request: Request): boolean {
  return dependencyInjectionState.from(request);
}
