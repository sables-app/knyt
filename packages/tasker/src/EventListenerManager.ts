import {
  Beacon,
  ensureReference,
  type Observable,
  type Reference,
} from "@knyt/artisan";

import type { BasicEvent } from "./BasicEvent";
import type { Effect } from "./Effect";
import type { EventListenableObserver } from "./EventListenableObserver";
import { EventListenerController } from "./EventListenerController";
import type { ReactiveControllerHost } from "./ReactiveController";
import type { InferTypedEventFromName } from "./types";

/**
 * A factory and manger for event listener controllers.
 *
 * @alpha
 */
export class EventListenerManager<E extends BasicEvent.Listenable>
  implements Effect
{
  #host: ReactiveControllerHost;
  #target$: Reference.Readonly<E | null>;

  #controllers: EventListenerController<any, E>[] = [];

  constructor(host: ReactiveControllerHost, target: Reference.Maybe<E>) {
    const target$ = ensureReference(target);

    this.#host = host;
    this.#target$ = target$;
  }

  /**
   * Creates a new event listener controller for the given event name
   * and listener, and adds it to the manager.\
   *
   * @returns An instance of `EventListenerController` that can be used to manage the event listener.
   */
  create<K extends string>(
    eventName: K,
    listener: EventListenableObserver.Listener<K, E>,
    options?: AddEventListenerOptions,
  ): EventListenerController<K, E> {
    const controller = new EventListenerController(this.#host, {
      eventName,
      listener,
      target$: this.#target$,
      options,
    });

    this.#controllers.push(controller);

    return controller;
  }

  /**
   * Adds a new event listener controller to the manager
   * for the given event name and listener.
   *
   * @returns The current instance of `EventListenerManager` for chaining.
   */
  add<K extends string>(
    eventName: K,
    listener: EventListenableObserver.Listener<K, E>,
    options?: AddEventListenerOptions,
  ): this {
    this.create<K>(eventName, listener, options);

    return this;
  }

  /**
   * Creates an observable that emits events of the given type
   * from the target element when the event is fired.
   *
   * @returns An observable that emits events of the specified type.
   */
  observe<K extends string>(
    eventName: K,
    options?: AddEventListenerOptions,
  ): Observable<InferTypedEventFromName<K, E>> {
    const signaler = Beacon.withEmitter<InferTypedEventFromName<K, E>>();
    const controller = this.create<K>(eventName, signaler.next, options);

    controller.disposeSignal.subscribe(signaler.complete);

    return signaler.beacon;
  }

  /**
   * Adds all event listeners to the target element.
   */
  setup(): void {
    for (const controller of this.#controllers) {
      controller.setup();
    }
  }

  /**
   * Removes all event listeners from the target element.
   */
  teardown(): void {
    for (const controller of this.#controllers) {
      controller.teardown();
    }
  }

  /**
   * Disposes of all event listeners from the target element
   */
  dispose(): void {
    for (const controller of this.#controllers) {
      controller.dispose();
    }

    this.#controllers = [];
  }
}
