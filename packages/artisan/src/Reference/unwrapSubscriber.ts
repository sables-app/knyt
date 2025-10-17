import type { Observable, Observer } from "../Observable/mod.ts";
import { EnsuredReferenceObserver } from "./EnsuredReferenceObserver.ts";
import type { Reference } from "./types.ts";

/**
 * Creates an observer to proxy a subscriber reference.
 *
 * @remarks
 *
 * Effectively ensures that an optional subscriber
 * always exists and is subscribed to the consuming observable.
 */
export function unwrapSubscriber<T>(
  input: Reference.Readonly<Observable.Subscriber<T> | undefined>,
): Observer<T> {
  return new EnsuredReferenceObserver(input);
}
