import { ListenerModifier } from "./constants";
import type {
  AnyProps,
  EventFromType,
  EventHandler,
  ListenerDeclaration,
  ListenerDeclarationType,
} from "./types/mod";

/**
 * Modifiers that affect event listener options accepted by the `addEventListener` method.
 */
const optionModifiers = [
  ListenerModifier.Capture,
  ListenerModifier.Once,
  ListenerModifier.Passive,
] as const;

/**
 * Modifiers that affect how events are handled by the listener.
 *
 * Use of these modifiers is will result in the provided handler being wrapped
 * in a new function that applies the modifier behavior.
 *
 * As a result, it is not recommended to use these modifiers inside render functions
 * where the handler would be recreated on each render.
 */
const eventHandlingModifiers = [
  ListenerModifier.Stop,
  ListenerModifier.Prevent,
  ListenerModifier.Self,
] as const;

class ModifiedListenerBuilder<
  T extends ListenerDeclarationType,
  P extends AnyProps = AnyProps,
  E extends AnyProps = P,
> {
  #type: T;
  #modifiers: Set<ListenerModifier> = new Set();

  constructor(type: T) {
    this.#type = type;
  }

  #getOptionsFromModifiers(): AddEventListenerOptions | undefined {
    const options: AddEventListenerOptions = {};

    let optionWasSet = false;

    for (const modifier of optionModifiers) {
      if (this.#modifiers.has(modifier)) {
        options[modifier] = true;
        optionWasSet = true;
      }
    }

    return optionWasSet ? options : undefined;
  }

  #getDeclarationHandler(
    handler: EventHandler<E, EventFromType<T>>,
  ): EventHandler<E, EventFromType<T>> {
    const hasEventHandlingModifiers = eventHandlingModifiers.some((modifier) =>
      this.#modifiers.has(modifier),
    );

    if (!hasEventHandlingModifiers) {
      return handler;
    }

    const modifiers = this.#modifiers;

    return function (event) {
      if (modifiers.has(ListenerModifier.Stop)) {
        event.stopPropagation();
      }
      if (modifiers.has(ListenerModifier.Prevent)) {
        event.preventDefault();
      }
      if (modifiers.has(ListenerModifier.Self)) {
        if (event.target !== event.currentTarget) {
          return;
        }
      }

      handler.call(this, event);
    };
  }

  #getDeclarationOptions(
    options: AddEventListenerOptions | undefined,
  ): AddEventListenerOptions | undefined {
    const modifiersOptions = this.#getOptionsFromModifiers();

    if (!modifiersOptions && !options) {
      return undefined;
    }

    return {
      ...modifiersOptions,
      ...options,
    };
  }

  addModifier(modifier: ListenerModifier): void {
    this.#modifiers.add(modifier);
  }

  readonly defineListener = (
    handler: EventHandler<E, EventFromType<T>>,
    options?: AddEventListenerOptions,
  ): ListenerDeclaration<E, T> => {
    return {
      type: this.#type,
      handler: this.#getDeclarationHandler(handler),
      options: this.#getDeclarationOptions(options),
    };
  };
}

function createListenerBuilder(): ListenerBuilder {
  return new Proxy(defineListener, {
    get: (_target, propertyName, _receiver) => {
      if (typeof propertyName !== "string") {
        throw new Error("Invalid event type. It must be a string.");
      }

      const modifiedListener = new ModifiedListenerBuilder(propertyName);

      function createModifierProxy() {
        return new Proxy(modifiedListener.defineListener, {
          get: (_target, propertyName, _receiver) => {
            if (!isListenerModifier(propertyName)) {
              throw new Error(
                "Invalid property name. The property must be a listener modifier.",
              );
            }

            modifiedListener.addModifier(propertyName);

            return createModifierProxy();
          },
        }) as any;
      }

      return createModifierProxy();
    },
  }) as any;
}

export const listen = createListenerBuilder();

type ListenerBuilder = ListenerBuilder.DefineListener & {
  [T in keyof GlobalEventHandlersEventMap]: ListenerBuilder.DefineListenerWithType<T>;
};

namespace ListenerBuilder {
  export interface DefineListenerWithType<
    T extends keyof GlobalEventHandlersEventMap,
  > {
    <E extends AnyProps = AnyProps>(
      // The handler is a required parameter, but it accepts
      // `undefined` to facilitate optional event handlers.
      // When the handler is `undefined`, the method should be a no-op.
      handler: EventHandler<E, GlobalEventHandlersEventMap[T]> | undefined,
      options?: AddEventListenerOptions,
    ): ListenerDeclaration<E, T>;
    [ListenerModifier.Stop]: DefineListenerWithType<T>;
    [ListenerModifier.Prevent]: DefineListenerWithType<T>;
    [ListenerModifier.Self]: DefineListenerWithType<T>;
    [ListenerModifier.Capture]: DefineListenerWithType<T>;
    [ListenerModifier.Once]: DefineListenerWithType<T>;
    [ListenerModifier.Passive]: DefineListenerWithType<T>;
  }

  export type DefineListener = <
    T extends ListenerDeclarationType,
    E extends AnyProps,
  >(
    type: T,
    handler: EventHandler<E, EventFromType<T>>,
    options?: AddEventListenerOptions,
  ) => ListenerDeclaration<E, T>;
}

function defineListener<E extends AnyProps, T extends ListenerDeclarationType>(
  type: T,
  handler: EventHandler<E, EventFromType<T>>,
  options?: AddEventListenerOptions,
): ListenerDeclaration<E, T> {
  return {
    type,
    handler,
    options,
  };
}

function isListenerModifier(value: unknown): value is ListenerModifier {
  return Object.values(ListenerModifier).includes(value as ListenerModifier);
}
