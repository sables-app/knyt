import type { Subscription } from "@knyt/artisan";

import type { ValueUpdateHandler } from "./types.ts";

export enum ContextEventName {
  ValueUpdate = "knyt-value-update",
  ContextRequest = "knyt-context-request",
  ContextProviderAvailable = "knyt-context-provider-available",
}

export class ContextRequestEvent<T> extends Event {
  readonly contextKey: symbol;
  readonly handleValueUpdate: ValueUpdateHandler<T>;
  readonly subscription = Promise.withResolvers<Subscription>();
  readonly resubscribe: () => void;

  #subscriptionIsSettled = false;

  get wasHandled(): boolean {
    return this.#subscriptionIsSettled;
  }

  constructor({
    contextKey,
    handleValueUpdate,
    resubscribe,
  }: {
    contextKey: symbol;
    handleValueUpdate: ValueUpdateHandler<T>;
    resubscribe: () => void;
  }) {
    super(ContextEventName.ContextRequest, {
      bubbles: true,
      composed: true,
    });

    this.contextKey = contextKey;
    this.handleValueUpdate = handleValueUpdate;
    this.resubscribe = resubscribe;

    this.subscription.promise.finally(() => {
      this.#subscriptionIsSettled = true;
    });
  }
}

export class ContextProviderAvailableEvent extends Event {
  readonly contextKey: symbol;

  constructor(contextKey: symbol) {
    super(ContextEventName.ContextProviderAvailable, {
      bubbles: true,
      composed: true,
    });

    this.contextKey = contextKey;
  }
}

declare global {
  interface HTMLElementEventMap {
    [ContextEventName.ContextRequest]: ContextRequestEvent<unknown>;
  }
}
