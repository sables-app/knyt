import type { EventHandler, TypedEvent } from "./types/core";

type NativeEventHandler<T, U extends Event> = (this: T, event: U) => any;

export type InferNativeHandler<H> =
  H extends EventHandler<infer T, infer U> ? NativeEventHandler<T, U> : never;

/**
 * A no-op helper function that converts an `EventHandler` type,
 * into a type that's compatible with TypeScript's native DOM declarations.
 *
 * @see EventHandler
 */
export function inferNativeHandler<T, U extends Event>(
  handler: EventHandler<T, U>,
): NativeEventHandler<T, U> {
  return handler as any;
}

/**
 * A no-op helper function that converts a `TypedEvent` type,
 * into a type that's compatible with TypeScript's native DOM declarations.
 *
 * @see EventHandler
 */
export function inferNativeEvent<T, U extends Event>(
  event: TypedEvent<T, U>,
): U {
  return event as any;
}

/**
 * A no-op helper function that converts a native event type,
 * into a `TypedEvent` that's compatible with Knyt's event handlers.
 *
 * @see EventHandler
 */
export function inferTypedEvent<U extends Event, T = Element>(
  event: U,
): TypedEvent<T, U> {
  return event as any;
}
