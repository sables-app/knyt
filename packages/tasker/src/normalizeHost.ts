import type { ReactiveControllerHost } from "./ReactiveController";

export function normalizeHost(
  host: ReactiveControllerHost | (() => ReactiveControllerHost),
) {
  return "requestUpdate" in host ? host : host();
}
