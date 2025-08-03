/**
 * Types for listening to and dispatching events
 * based on the `EventTarget` interface, but allows for
 * asynchronous event handling and custom event types.
 *
 * @internal scope: package
 */
/*
 * ### Private Remarks
 *
 * I spent too long debating the name of this namespace 🙃
 */
export namespace BasicEvent {
  /**
   * A handler that is awaited when an event is dispatched.
   *
   * @remarks
   *
   * This type has a similar usage as `Observable.Subscriber` in that
   * it allows you to define a function that will be called when an event is dispatched.
   *
   * @public
   */
  export type Listener<T extends Event> = (
    event: T,
  ) => Promise<unknown> | unknown;

  /**
   * An object that can be listened to for events.
   *
   * @remarks
   *
   * This type has a similar usage as `Observable` in that it allows you to listen for events
   * using the `addEventListener` and `removeEventListener` methods.
   *
   * @public
   */
  export type Listenable = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
  >;

  /**
   * An object that can dispatch events.
   *
   * @public
   */
  export type Dispatcher = {
    dispatchEvent(event: Event): Promise<boolean> | boolean;
  };

  /**
   * An object that can be listened to for events and can dispatch events.
   *
   * @public
   */
  export type Emitter = Listenable & Dispatcher;
}
