import {
  sequentialPairs,
  type Observer,
  type Reference,
  type SequentialPair,
} from "@knyt/artisan";
import type { EventHandler } from "@knyt/weaver";

import type { BasicEvent } from "./BasicEvent";
import type { Effect } from "./Effect";
import type { InferEventFromName } from "./types";

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
 * import { EventListenableObserver } from "@knyt/tasker";
 *
 * new EventListenableObserver({
 *   eventName: "click",
 *   listener(event) {
 *     console.info("click event", event);
 *   },
 *   target$: createReference(document.body),
 * });
 *
 * @public
 */
export class EventListenableObserver<
    K extends string,
    E extends BasicEvent.Listenable,
  >
  implements Observer<E | null>, Effect
{
  #isSetup = false;
  #eventName: K;
  #listener: EventListenableObserver.Listener<K, E>;
  #eventOptions?: AddEventListenerOptions;

  readonly #listenable$: Reference.Readonly<E | null>;

  constructor({
    eventName,
    listener,
    target$: listenable$,
    options: eventOptions,
  }: EventListenableObserver.Options<K, E>) {
    this.#eventName = eventName;
    this.#listener = listener;
    this.#eventOptions = eventOptions;
    this.#listenable$ = listenable$;

    listenable$.subscribe(this);
  }

  #targetObserver = sequentialPairs<E | null>(
    null,
    ([previousTarget, currentTarget]: SequentialPair<E | null>): void => {
      if (previousTarget) {
        this.#teardownTarget(previousTarget);
      }
      if (currentTarget) {
        this.#setupTarget(currentTarget);
      }
    },
  );

  next(nextTarget: E | null) {
    this.#targetObserver.next(nextTarget);
  }

  #setupTarget(target: E) {
    if (this.#isSetup) return;

    target.addEventListener(
      this.#eventName,
      // Typecast due to incompatible types
      this.#listener as unknown as EventListener,
      this.#eventOptions,
    );

    this.#isSetup = true;
  }

  #teardownTarget(target: E) {
    if (!this.#isSetup) return;

    target.removeEventListener(
      this.#eventName,
      // Typecast due to incompatible types
      this.#listener as unknown as EventListener,
      this.#eventOptions,
    );

    this.#isSetup = false;
  }

  /**
   * Adds the event listener to the target element.
   */
  setup(): void {
    const target = this.#listenable$.value;

    if (target) {
      this.#setupTarget(target);
    }
  }

  /**
   * Removes the event listener from the target element.
   */
  teardown(): void {
    const target = this.#listenable$.value;

    if (target) {
      this.#teardownTarget(target);
    }
  }

  dispose(): void {
    this.teardown();
  }
}

export namespace EventListenableObserver {
  export type Listener<
    K extends string,
    E extends BasicEvent.Listenable,
  > = EventHandler<E, InferEventFromName<K>>;

  export type Options<K extends string, E extends BasicEvent.Listenable> = {
    eventName: K;
    listener: EventListenableObserver.Listener<K, E>;
    target$: Reference.Readonly<E | null>;
    options?: AddEventListenerOptions;
  };
}
