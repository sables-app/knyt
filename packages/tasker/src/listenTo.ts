import { type Reference } from "@knyt/artisan";

import type { BasicEvent } from "./BasicEvent";
import { EventListenerManager } from "./EventListenerManager";
import type { ReactiveControllerHost } from "./ReactiveController";

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
