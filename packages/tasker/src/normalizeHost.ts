import type { ReactiveControllerHost } from "./ReactiveController.ts";

export function normalizeHost(
  host: ReactiveControllerHost | (() => ReactiveControllerHost),
) {
  return "requestUpdate" in host ? host : host();
}
