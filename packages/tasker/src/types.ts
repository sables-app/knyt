import type { TypedEvent } from "@knyt/html-type";

import type { BasicEvent } from "./BasicEvent.ts";

/**
 * A handler that is awaited when an event is dispatched.
 */
export type AsyncEventListener<T> = (event: T) => Promise<unknown>;

/**
 * A handler that is called when an event is dispatched.
 *
 * The handle may be either synchronous or asynchronous.
 * If the handler is asynchronous, the resulting promise is awaited.
 * Otherwise, the handler is called synchronously.
 *
 * TODO: Consider, return `void | Promise<void>`
 *
 * @internal scope: workspace
 */
export type SyncEventListener<T> = (event: T) => unknown;

/**
 * @beta
 */
export type InferEventFromName<K extends string> =
  K extends keyof HTMLElementEventMap
  ? HTMLElementEventMap[K]
  : K extends keyof GlobalEventHandlersEventMap
  ? GlobalEventHandlersEventMap[K]
  : Event;

/**
 * @beta
 */
export type InferTypedEventFromName<
  K extends string,
  E extends BasicEvent.Listenable,
> = TypedEvent<E, InferEventFromName<K>>;
