import { ensureReference, type Reference } from "@knyt/artisan";
import { EventStation, type Listeners } from "event-station";

import type { BasicEvent } from "./BasicEvent";
import type { SyncEventListener } from "./types";

/**
 * @public
 */
export type PropertyChangePayload<
  P extends string | symbol | number = string,
  T = unknown,
> = {
  currentValue: T;
  previousValue: T;
  propertyName: P;
};

/**
 * @public
 */
export type PropertyChangeHandler<
  P extends string | symbol | number = string,
  T = unknown,
> = (args: PropertyChangePayload<P, T>) => void;

/**
 * @public
 */
export type InferPropertyChangePayload<
  T,
  P extends keyof T = keyof T,
> = PropertyChangePayload<P, T[P]>;

/**
 * @public
 */
export type InferPropertyChangeHandler<
  T,
  P extends keyof T = keyof T,
> = PropertyChangeHandler<P, T[P]>;

type EventListeners = {
  [K in keyof HTMLElementEventMap]: SyncEventListener<HTMLElementEventMap[K]>;
};

/**
 * An event emitter that facilitates dispatching events asynchronously.
 *
 * @remarks
 *
 * This class partially implements the interface of native event emitters
 * to dispatch events on both a given event emitter, which is typically a DOM element,
 * and an internal event station asynchronously.
 *
 * The goal is to provide a way to dispatch native-like events asynchronously in a similar manner
 * to the native interfaces facilitating better interoperability.
 */
export class BasicEmitter implements BasicEvent.Emitter {
  /**
   * A reference to a paired dispatcher that can be another event emitter
   * or a target element to dispatch events on.
   *
   * A dispatched event will be dispatched synchronously on this dispatcher first,
   * and then dispatched asynchronously on the internal event station.
   *
   * @defaultValue null
   */
  readonly #pairedDispatcher$: Reference.Readonly<BasicEvent.Dispatcher | null>;

  #station = new EventStation<EventListeners>();

  /**
   * @param pairedDispatcher - Another event emitter or a target element to dispatch events on.
   */
  /*
   * ### Private Remarks
   *
   * The `pairedDispatcher` parameter is always required, by design.
   * This is to ensure that the event emitter is always intentionally
   * either associated with another emitter or not.
   *
   * If `null` is passed, the event will only be dispatched on the internal event station;
   * not dispatching events in the DOM.
   */
  constructor(pairedDispatcher: BasicEmitter.Input) {
    this.#pairedDispatcher$ = ensureReference(pairedDispatcher);
  }

  /**
   * Dispatch the event on the target element and the event station.
   *
   * If the target element is not set, the event will only be dispatched on the event station.
   *
   * @remarks
   *
   * The event should be defined on `HTMLElementEventMap`.
   *
   * ```ts
   * define global {
   *   interface HTMLElementEventMap {
   *     "custom-event": CustomEvent;
   *   }
   * }
   * ```
   *
   * @see HTMLElementEventMap
   */
  async dispatchEvent<T extends HTMLElementEventMap[keyof HTMLElementEventMap]>(
    customEvent: T,
  ): Promise<boolean> {
    // Dispatch the event synchronously on the target element first.
    this.#pairedDispatcher$.value?.dispatchEvent(customEvent);
    // Then, dispatch the event asynchronously on the event station.
    await this.#station.emitAsync(
      customEvent.type as keyof HTMLElementEventMap,
      customEvent,
    );

    return !customEvent.cancelable || !customEvent.defaultPrevented;
  }

  /**
   * Add an event listener to the emitter.
   *
   * TODO: Add support for `options.async` to add the listener to the event station.
   */
  addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: SyncEventListener<HTMLElementEventMap[K]>,
    options?: boolean | AddEventListenerOptions,
  ): void;

  addEventListener(
    type: keyof HTMLElementEventMap,
    listener: SyncEventListener<HTMLElementEventMap[keyof HTMLElementEventMap]>,
    options?: boolean | AddEventListenerOptions,
  ): void {
    let listeners: Listeners<EventListeners>;

    if (typeof options === "object" && options.once) {
      listeners = this.#station.once(type, listener);
    } else {
      listeners = this.#station.on(type, listener);
    }

    if (typeof options === "object" && options.signal) {
      options.signal.addEventListener("abort", () => listeners.off(), {
        once: true,
      });
    }
  }

  /**
   * Remove an event listener to the emitter.
   *
   * TODO: Add support for `options.async` to remove the listener to the event station.
   */
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: SyncEventListener<HTMLElementEventMap[K]>,
    _options?: boolean | EventListenerOptions,
  ): void;

  removeEventListener(
    type: keyof HTMLElementEventMap,
    listener: SyncEventListener<HTMLElementEventMap[keyof HTMLElementEventMap]>,
    _options?: boolean | EventListenerOptions,
  ): void {
    this.#station.off(type, listener);
  }

  replaceEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listenerPair: readonly [
      prevListener: SyncEventListener<HTMLElementEventMap[K]> | undefined,
      nextListener: SyncEventListener<HTMLElementEventMap[K]> | undefined,
    ],
    options?: boolean | AddEventListenerOptions,
  ): void {
    const [prevListener, nextListener] = listenerPair;

    if (prevListener) {
      this.removeEventListener(type, prevListener, options);
    }
    if (nextListener) {
      this.addEventListener(type, nextListener, options);
    }
  }

  /**
   * @deprecated
   */
  // TODO: Remove this after the migration to the new API is complete.
  #createEventListenerPropertyChangeHandler<
    T,
    P extends keyof T = keyof T,
    K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap,
  >(
    domEventNameByPropertyName: Partial<Record<P, K>>,
  ): InferPropertyChangeHandler<T, P> {
    return ({
      currentValue,
      previousValue,
      propertyName,
    }: {
      currentValue: T[P];
      previousValue: T[P];
      propertyName: P;
    }): void => {
      const domEventName = domEventNameByPropertyName[propertyName];

      if (!domEventName) return;

      type Listener = SyncEventListener<HTMLElementEventMap[K]>;

      const listenerPair = [previousValue, currentValue] as [
        Listener | undefined,
        Listener | undefined,
      ];

      this.replaceEventListener(domEventName, listenerPair);
    };
  }

  /**
   * Creates a property change handler that replaces the event listener for the associated DOM event.
   *
   * @remarks
   *
   * This can be used as a standalone function.
   *
   * @deprecated
   */
  // TODO: Remove this after the migration to the new API is complete.
  createEventListenerPropertyChangeHandler =
    this.#createEventListenerPropertyChangeHandler.bind(this);
}

export namespace BasicEmitter {
  export type Input = null | Reference.Maybe<BasicEvent.Dispatcher>;
}
