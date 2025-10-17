import { type Reference } from "@knyt/artisan";

import type {
  ReactiveController,
  ReactiveControllerHost,
} from "../ReactiveController.ts";

/** @public */
export type Context<T> = {
  Consumer: {
    new (
      host: ReactiveControllerHost,
      options: {
        onUpdate?: Reference.UpdateHandler<T>;
        target: Reference.Maybe<HTMLElement>;
      },
    ): Context.ConsumerType<T>;
  };

  Provider: {
    new (
      host: ReactiveControllerHost,
      options: {
        target: Reference.Maybe<HTMLElement>;
      },
    ): Context.ProviderType<T>;
  };

  createConsumer(
    host: ReactiveControllerHost & HTMLElement,
  ): Context.ConsumerType<T>;

  createProvider(
    host: ReactiveControllerHost & HTMLElement,
  ): Context.ProviderType<T>;

  readonly initialValue: T;
};

export namespace Context {
  export type ToValue<C> = C extends Context<infer T> ? T : never;

  /** @public */
  export type ConsumerType<T> = ReactiveController & Reference.Readonly<T>;
  /** @public */
  export type ProviderType<T> = ReactiveController & Reference<T>;
  /**
   * Infer the context  consumer type from a context type.
   *
   * @public
   */
  export type InferConsumer<C> = ConsumerType<ToValue<C>>;
  /**
   * Infer the context provider type from a context type.
   *
   * @public
   */
  export type InferProvider<C> = ProviderType<ToValue<C>>;
}

/** @internal scope: workspace */
export type ValueUpdateHandler<T> = (value: T) => void;
