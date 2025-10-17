import {
  BasicReference,
  ensureReference,
  type Reference,
  type Subscription,
} from "@knyt/artisan";
import { EventStation, type Listeners } from "event-station";

import type { BasicEvent } from "../BasicEvent.ts";
import { HostMonitor } from "../HostMonitor.ts";
import { listenTo } from "../listenTo.ts";
import type { ReactiveControllerHost } from "../ReactiveController.ts";
import {
  ContextEventName,
  ContextProviderAvailableEvent,
  ContextRequestEvent,
} from "./events.ts";
import type { Context, ValueUpdateHandler } from "./types.ts";

type EventListeners<T> = {
  [ContextEventName.ValueUpdate]: ValueUpdateHandler<T>;
};

export abstract class BaseProvider<T>
  extends BasicReference<T>
  implements Context.ProviderType<T>
{
  #host: ReactiveControllerHost;
  #station = new EventStation<EventListeners<T>>();
  #emitter$: Reference.Readonly<BasicEvent.Emitter | null>;

  #hostMonitor: HostMonitor;

  /** @internal scope: package */
  protected abstract get _contextKey(): symbol;

  /** @internal scope: package */
  protected abstract _isRelevantContextRequest(
    event: unknown,
  ): event is ContextRequestEvent<T>;

  constructor(
    host: ReactiveControllerHost,
    {
      initialValue,
      target,
    }: {
      initialValue: T;
      target: Reference.Maybe<HTMLElement>;
    },
  ) {
    super({
      initialValue,
      onUpdate: (value) => {
        if (this.#hostMonitor.isHostConnected) {
          this.#station.emit(ContextEventName.ValueUpdate, value);
        }
      },
    });

    this.#host = host;
    this.#emitter$ = ensureReference(target);

    this.#hostMonitor = new HostMonitor(host);

    listenTo(this.#host, this.#emitter$)
      .add(ContextEventName.ContextRequest, (contextRequest) => {
        if (!this._isRelevantContextRequest(contextRequest)) {
          // Ignore requests for other contexts.
          return;
        }

        this.#onContextRequest(contextRequest);
      })
      .add(ContextEventName.ContextProviderAvailable, () => {
        this.#onContextProviderAvailable();
      });

    host.addController(this);
  }

  #isConsumerSubscribed(handleValueUpdate: ValueUpdateHandler<T>): boolean {
    return !!this.#station.getListeners(
      ContextEventName.ValueUpdate,
      handleValueUpdate,
    );
  }

  #onContextRequest(contextRequest: ContextRequestEvent<unknown>): void {
    // Stop the event from propagating to other providers.
    // At this point, we're assuming that the event is intended for this provider.
    contextRequest.stopImmediatePropagation();

    if (contextRequest.wasHandled) {
      // Ignore requests from consumers that already have a resolved subscription.
      console.warn("Consumer was already handled.");
      return;
    }
    if (this.#isConsumerSubscribed(contextRequest.handleValueUpdate)) {
      contextRequest.subscription.reject(
        new Error("Consumer is already subscribed to the provider."),
      );
      return;
    }

    // Provide the consumer with the current value immediately.
    contextRequest.handleValueUpdate(this.get());

    // Subscribe the consumer to future updates.
    const listeners = this.#station.on(
      ContextEventName.ValueUpdate,
      contextRequest.handleValueUpdate,
      contextRequest,
    );

    const subscription: Subscription = {
      unsubscribe() {
        listeners.off();
      },
    };

    contextRequest.subscription.resolve(subscription);
  }

  #onContextProviderAvailable() {
    const allListeners = this.#station.getListeners(
      ContextEventName.ValueUpdate,
    ) as Listeners<EventListeners<T>> | undefined;

    allListeners?.forEach((listener) => {
      const contextRequest = listener.context;

      if (contextRequest instanceof ContextRequestEvent === false) {
        // This should never happen.
        throw new Error("Invalid context request.");
      }

      contextRequest.resubscribe();
    });
  }

  hostConnected(): void {
    this.#emitter$
      .get()
      ?.dispatchEvent(new ContextProviderAvailableEvent(this._contextKey));
  }
}
