import {
  __isKnytReference,
  ensureReference,
  OBSERVABLE_PROPERTY_NAME,
  type Observable,
  type ObservableInterop,
  type Reference,
  type Subscription,
} from "@knyt/artisan";

import type { BasicEvent } from "../BasicEvent";
import { hold } from "../hold";
import type { ReactiveControllerHost } from "../ReactiveController";
import { ContextRequestEvent } from "./events";
import type { Context } from "./types";

export abstract class BaseConsumer<T> implements Context.ConsumerType<T> {
  #state: Reference<T>;
  #dispatcher$: Reference.Readonly<BasicEvent.Dispatcher | null>;
  #subscription: Subscription | null = null;

  /** @internal scope: package */
  protected abstract get _contextKey(): symbol;

  constructor(
    host: ReactiveControllerHost,
    {
      initialValue,
      target: dispatcher,
      onUpdate,
    }: {
      initialValue: T;
      target: Reference.Maybe<BasicEvent.Dispatcher>;
      onUpdate?: Reference.UpdateHandler<T>;
    },
  ) {
    this.#state = hold<T>(host, initialValue, onUpdate);
    this.#dispatcher$ = ensureReference(dispatcher);

    host.addController(this);
  }

  subscribe(subscriber: Observable.Subscriber<T>) {
    return this.#state.subscribe(subscriber);
  }

  hostConnected(): void {
    this.#setup();
  }

  hostDisconnected(): void {
    this.#teardown();
  }

  async #handleSubscription(sub: Promise<Subscription>): Promise<void> {
    try {
      this.#subscription = await sub;
    } catch (error) {
      console.error(error);
    }
  }

  #resubscribe(): void {
    this.#teardown();
    this.#setup();
  }

  #setup(): void {
    const handleValueUpdate = (value: T): void => {
      this.#state.set(value);
    };

    const contextRequest = new ContextRequestEvent({
      contextKey: this._contextKey,
      handleValueUpdate,
      resubscribe: () => this.#resubscribe(),
    });

    this.#handleSubscription(contextRequest.subscription.promise);
    this.#dispatcher$.value?.dispatchEvent(contextRequest);
  }

  #teardown(): void {
    this.#subscription?.unsubscribe();
    this.#subscription = null;
  }

  get value(): T {
    return this.#state.get();
  }

  readonly get = (): T => {
    return this.#state.get();
  };

  readonly [__isKnytReference] = true;

  asInterop(): ObservableInterop<T> {
    return this.#state.asInterop();
  }

  [Symbol.observable](): ObservableInterop<T> {
    return this.asInterop();
  }

  [OBSERVABLE_PROPERTY_NAME](): ObservableInterop<T> {
    return this.asInterop();
  }
}
