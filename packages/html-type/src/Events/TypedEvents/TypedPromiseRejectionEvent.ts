import { TypedEvent } from "./TypedEvent.ts";

export interface TypedPromiseRejectionEvent<T> extends TypedEvent<T> {
  readonly promise: Promise<unknown>;
  readonly reason: unknown;
}
