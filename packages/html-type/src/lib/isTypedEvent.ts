import { TypedEvent } from "../Events";

/**
 * @remarks
 *
 * Precautions need to be taken when using this function,
 * because it makes use of `instanceof` checks.
 *
 * This means that if the constructor is not in the same context,
 * or if multiple copies of the same constructor are used,
 * it will not work as expected.
 */
export function isTypedEvent<T, U extends Event = Event>(
  TargetConstructor: new (...args: any[]) => T,
  EventConstructor: new (...args: any[]) => U,
  event: unknown,
): event is TypedEvent<T, U> {
  return (
    event instanceof EventConstructor &&
    event.target instanceof TargetConstructor
  );
}

/**
 * @remarks
 *
 * Precautions need to be taken when using this function,
 * because it makes use of `instanceof` checks.
 *
 * This means that if the constructor is not in the same context,
 * or if multiple copies of the same constructor are used,
 * it will not work as expected.
 */
export function assertTypedEvent<T, U extends Event = Event>(
  TargetConstructor: new (...args: any[]) => T,
  EventConstructor: new (...args: any[]) => U,
  event: unknown,
): asserts event is TypedEvent<T, U> {
  if (!isTypedEvent(TargetConstructor, EventConstructor, event)) {
    throw new TypeError(
      `Expected a ${EventConstructor.name} event with a target of type ${TargetConstructor.name}`,
    );
  }
}
