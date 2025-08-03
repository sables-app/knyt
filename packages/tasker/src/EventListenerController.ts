import { Beacon, type Observer } from "@knyt/artisan";

import type { BasicEvent } from "./BasicEvent";
import type { Effect } from "./Effect";
import { EventListenableObserver } from "./EventListenableObserver";
import type {
  ReactiveController,
  ReactiveControllerHost,
} from "./ReactiveController";

/**
 * A controller that manages an event listener on an element.
 *
 * @remarks
 *
 * This controller should be added before the host is connected.
 *
 * @example
 *
 * ```ts
 * import { createReference } from "@knyt/artisan";
 * import { EventListenerController } from "@knyt/tasker";
 *
 * new EventListenerController(host, {
 *   eventName: "click",
 *   listener(event) {
 *     console.info("click event", event);
 *   },
 *   target$: createReference(document.body),
 * });
 *
 * @public
 */
export class EventListenerController<
    K extends string,
    E extends BasicEvent.Listenable,
  >
  implements ReactiveController, Observer<E | null>, Effect
{
  #host: ReactiveControllerHost;
  #observer: EventListenableObserver<K, E>;

  constructor(
    host: ReactiveControllerHost,
    options: EventListenableObserver.Options<K, E>,
  ) {
    this.#host = host;
    this.#observer = new EventListenableObserver<K, E>(options);

    host.addController(this);
  }

  next(nextTarget: E | null) {
    this.#observer.next(nextTarget);
  }

  setup() {
    this.#observer.setup();
  }

  teardown() {
    this.#observer.teardown();
  }

  hostConnected() {
    this.#observer.setup();
  }

  hostDisconnected() {
    this.#observer.teardown();
  }

  /**
   * Removes the event listener from the target element
   * and disposes of the controller.
   */
  dispose() {
    // Prevent further setup or teardown
    this.#host.removeController(this);
    // Clean up the event listener
    this.#observer.dispose();

    if (!this.#disposeSignaler.hasTerminated) {
      // Emit a signal to indicate that the controller is disposed
      this.#disposeSignaler.next();
      // Complete the signaler to prevent further emissions
      this.#disposeSignaler.complete();
    }
  }

  #disposeSignaler = Beacon.withEmitter<void>();

  get disposeSignal() {
    return this.#disposeSignaler.beacon;
  }
}
