import { type Reference } from "@knyt/artisan";

import type { BasicEvent } from "./BasicEvent.ts";
import { EventListenerManager } from "./EventListenerManager.ts";
import type { ReactiveControllerHost } from "./ReactiveController.ts";

/**
 * Creates a manager of event listeners on a target element for a host.
 *
 * @beta
 */
export function listenTo<E extends BasicEvent.Listenable>(
  host: ReactiveControllerHost,
  target: Reference.Maybe<E>,
): EventListenerManager<E> {
  return new EventListenerManager(host, target);
}
