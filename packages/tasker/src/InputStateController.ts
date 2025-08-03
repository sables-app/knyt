import {
  __isKnytReference,
  normalizeSubscriber,
  OBSERVABLE_PROPERTY_NAME,
  type Observable,
  type ObservableInterop,
  type Reference,
  type Subscription,
} from "@knyt/artisan";
import type { EventHandler } from "@knyt/weaver";

import { hold } from "./hold";
import type {
  ReactiveController,
  ReactiveControllerHost,
} from "./ReactiveController";

type InputStateOptions<T> = {
  /**
   * A reference serving as the source of truth for the input state.
   *
   * @remarks
   *
   * This reference should be updated in response to the `observe` subscriber
   * is notified of a new value.
   */
  origin: Reference.Readonly<T>;
  /**
   * A subscriber that is notified of new values when the input state changes.
   */
  subscriber: Observable.Subscriber<T>;
  /**
   * A function that parses a string value from an input element
   * to a value compatible with the `value` reference.
   */
  parse: (value: string) => T;
  /**
   * A function that serializes a value to a string
   * that can be used as the value of an input element.
   */
  serialize: (value: T) => string;
};

/**
 * A controller that manages the state of an input element.
 *
 * @alpha This is an experimental API and will change in the future.
 */
export class InputStateController<
    T,
    E extends Element & { value: string } = HTMLInputElement,
  >
  implements ReactiveController, Reference<T>
{
  readonly #host: ReactiveControllerHost;
  readonly #options: Readonly<InputStateOptions<T>>;
  readonly #inputValue$: Reference<string>;
  readonly inputValue$: Reference.Readonly<string>;

  constructor(host: ReactiveControllerHost, options: InputStateOptions<T>) {
    this.#host = host;
    this.#options = options;

    const { origin: origin$, serialize } = options;
    const initialInputValue = serialize(origin$.value);

    this.#inputValue$ = hold(host, initialInputValue);
    this.inputValue$ = this.#inputValue$.asReadonly();

    host.addController(this);
    origin$.subscribe(this);
  }

  get value(): T {
    // This should be proxy to the origin reference.
    return this.#options.origin.get();
  }

  set value(nextValue: T) {
    // This should NOT be a proxy to the origin reference.
    // It should call the `set` method instead.
    this.set(nextValue);
  }

  get inputValue(): string {
    return this.#inputValue$.get();
  }

  subscribe(input: Observable.Subscriber<T>): Subscription {
    // This should be a proxy to the origin reference.
    return this.#options.origin.subscribe(input);
  }

  get(): T {
    // This should be a proxy to the origin reference.
    return this.#options.origin.get();
  }

  asReadonly(): Reference.Readonly<T> {
    // This should be a proxy to the origin reference.
    return this.#options.origin;
  }

  /**
   * Set the value of the input state.
   *
   * @remarks
   *
   * 1. Updates the origin reference
   * 2. Updates the input value state
   * 3. Notifies the observe subscriber of the new value
   */
  set(nextValue: T) {
    const { subscriber: observe, serialize } = this.#options;

    this.#inputValue$.set(serialize(nextValue));
    normalizeSubscriber(observe).next(nextValue);
  }

  next(nextValue: T) {
    // This should NOT be a proxy to the origin reference.
    // It should call the `set` method instead.
    this.set(nextValue);
  }

  /**
   * A handler that updates the input state when the element value changes.
   */
  readonly handleChange: EventHandler.Change<E> = (event) => {
    const { parse } = this.#options;
    // While it's unlikely that the event target will be null,
    // it's possible in some edge cases. As a result, we fallback
    // to an empty string to ensure that some value is always passed.
    const value = event.target?.value ?? "";

    this.set(parse(value));
  };

  /**
   * A handler that updates the input state when the end user
   * interacts with the input element.
   */
  /*
   * ### Private Remarks
   *
   * This is an alias for the `handleChange` handler,
   * but it's provided for consistency, clarity, and future-proofing.
   */
  readonly handleInput: EventHandler.Input<E> = this.handleChange;

  hostConnected?: () => void;

  get [__isKnytReference](): true {
    return true;
  }

  asInterop(): ObservableInterop<T> {
    return this.#options.origin.asInterop();
  }

  [Symbol.observable](): ObservableInterop<T> {
    return this.asInterop();
  }

  [OBSERVABLE_PROPERTY_NAME](): ObservableInterop<T> {
    return this.asInterop();
  }
}

export namespace InputStateController {
  export type Options<T> = InputStateOptions<T>;
}
