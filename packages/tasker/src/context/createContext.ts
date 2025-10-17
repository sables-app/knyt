import { type Reference } from "@knyt/artisan";

import type { ReactiveControllerHost } from "../ReactiveController.ts";
import { BaseConsumer } from "./BaseConsumer.ts";
import { BaseProvider } from "./BaseProvider.ts";
import { ContextRequestEvent } from "./events.ts";
import type { Context } from "./types.ts";

/**
 * @remarks
 *
 * This controller should be added before the host is connected.
 */
export function createContext<T>(
  initialValue: T,
  description?: string,
): Context<T> {
  /**
   * A unique key used to identify the context.
   */
  const contextKey = Symbol(description);

  function isRelevantContextRequest(
    event: unknown,
  ): event is ContextRequestEvent<T> {
    return (
      event instanceof ContextRequestEvent && event.contextKey === contextKey
    );
  }

  class Consumer extends BaseConsumer<T> {
    constructor(
      host: ReactiveControllerHost,
      {
        onUpdate,
        target,
      }: {
        onUpdate?: Reference.UpdateHandler<T>;
        target: Reference.Maybe<HTMLElement>;
      },
    ) {
      super(host, { initialValue, onUpdate, target });
    }

    /** @internal scope: package */
    protected get _contextKey() {
      return contextKey;
    }
  }

  class Provider extends BaseProvider<T> {
    constructor(
      host: ReactiveControllerHost,
      {
        target,
      }: {
        target: Reference.Maybe<HTMLElement>;
      },
    ) {
      super(host, { initialValue, target });
    }

    /** @internal scope: package */
    protected get _contextKey() {
      return contextKey;
    }

    /** @internal scope: package */
    protected _isRelevantContextRequest(
      event: unknown,
    ): event is ContextRequestEvent<T> {
      return isRelevantContextRequest(event);
    }
  }

  function createConsumer(
    host: ReactiveControllerHost & HTMLElement,
  ): Context.ConsumerType<T> {
    return new Consumer(host, { target: host });
  }

  function createProvider(
    host: ReactiveControllerHost & HTMLElement,
  ): Context.ProviderType<T> {
    return new Provider(host, { target: host });
  }

  return {
    Consumer,
    createConsumer,
    createProvider,
    initialValue,
    Provider,
  };
}
