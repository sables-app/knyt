/// <reference lib="dom.iterable" />
import {
  attributeValueToString,
  Beacon,
  createReference,
  isNonNullableObject,
  mapRef,
  replaceReferenceMutator,
  strictEqual,
  unknownToAttributeValue,
  unwrapRef,
  type BoundMap,
  type DOMAttributeValue,
  type ObjectToFunctionPropertyNames,
  type Observable,
  type Reference,
  type Subscription,
  type UnwrapRef,
} from "@knyt/artisan";
import type {
  PropertyChangePayload,
  ReactiveControllerHost,
} from "@knyt/tasker";
import { EventStation, type Listeners } from "event-station";

import { convertPropertiesDefinition } from "./convertPropertiesDefinition";
import type {
  PropertiesDefinition,
  PropertyDefinition,
  PropertyName,
  ReactiveProperties,
  ReactiveProperty,
} from "./types";

/**
 * A private symbol used to store the reactive properties on the prototype.
 *
 * This symbol doesn't need to be in the runtime-wide symbol registry (`Symbol.for`),
 * because it is only used internally in this module.
 */
const __reactiveProperties = Symbol("__reactiveProperties");

const PropertyChangeEventName = "KnytPropertyChange";

type EventListeners = {
  [PropertyChangeEventName]: (event: PropertyChangePayload<any, any>) => void;
};

/**
 * This symbol is used to attach the reactive adapter to an element.
 *
 * @remarks
 *
 * This symbol must be in the runtime-wide symbol registry
 * (`Symbol.for`) so that the reactive adapter can be
 * accessed from within different contexts.
 *
 * @internal scope: package
 */
export const __reactiveAdapter = Symbol.for("knyt.luthier.reactiveAdapter");

/**
 * Determines how the reactive adapter will handle updates.
 *
 * @internal scope: workspace
 */
export enum ReactiveUpdateMode {
  /**
   * Automatically request an update on the host when a property changes.
   *
   * @public
   */
  Reactive = "reactive",
  /**
   * Does not automatically request an update when a property changes.
   * However, an event will still be emitted when a property changes.
   *
   * @public
   */
  Manual = "manual",
}

enum ReactivePropertyChangeOrigin {
  /**
   * The property change originated from a property setter.
   */
  Property,
  /**
   * The property change originated from an attribute change.
   */
  Attribute,
}

/**
 * An object with reactive properties.
 */
export type Reactive = {
  [__reactiveAdapter]: ReactiveAdapter;
};

/**
 * @internal scope: package
 */
type ReactiveInternal = {
  /**
   * Available on an instance of a reactive element.
   */
  [__reactiveAdapter]: ReactiveAdapter;
  /**
   * Available on the prototype of a reactive element.
   */
  [__reactiveProperties]: ReactiveProperties;
};

enum HookName {
  Update = "update",
  UpdateRequest = "updateRequested",
}

const hookNames = Object.values(HookName);

type ChangedPropertiesByHookName<T = any> = Record<`${HookName}`, BoundMap<T>>;

/**
 * A reactive adapter for managing reactive properties on an element.
 */
/*
 * ### Private Remarks
 *
 * We can't use native private properties with mixins,
 * so we're using symbols to effectively create private properties.
 */
// TODO: Move into its own module.
export class ReactiveAdapter<
  Props extends Record<PropertyName, any> = Record<PropertyName, any>,
> {
  /** @internal scope: package */
  readonly #reactiveProperties: ReactiveProperties;

  /** @internal scope: package */
  readonly #hooks: ReactiveAdapter.Hooks;

  /** @internal scope: package */
  readonly #updateMode: `${ReactiveUpdateMode}`;

  /** @internal scope: package */
  readonly #propValues: Map<keyof Props, unknown>;

  /**
   * An event emitter for reactive property changes.
   *
   * @internal scope: package
   */
  readonly #reactivePropertyEmitter: EventStation<EventListeners>;

  /**
   * Determine if a property is currently being updated.
   * This is used to prevent unnecessary updates when a property is associated with an attribute.
   *
   * @internal scope: package
   */
  readonly #isPropertyUpdating$: Reference<boolean>;

  readonly isPropertyUpdating$: Reference.Readonly<boolean>;

  /**
   * Indicates whether the host object has completed its construction.
   * This flag is set to `true` after the construction phase finishes.
   *
   * @remarks
   *
   * All objects in JavaScript are constructed synchronously, so it is safe to
   * assume the host is fully constructed after a single microtask is queued.
   * The `ReactiveAdapter` is attached during the host's construction, and this
   * property is set to `true` after a microtask to guarantee the host is ready.
   *
   * This is mainly used to ensure that attributes are only set after the host
   * is fully constructed, since setting attributes on DOM elements during
   * construction is not allowed and will throw an error.
   */
  #isConstructed = false;

  /**
   * A record of changed properties since the occurrence
   * of certain lifecycle hooks.
   */
  #changedProperties: ChangedPropertiesByHookName = {
    [HookName.Update]: new Map<string, any>() as BoundMap<any>,
    [HookName.UpdateRequest]: new Map<string, any>() as BoundMap<any>,
  };

  constructor({
    reactiveProperties,
    hooks,
    options,
  }: {
    reactiveProperties: ReactiveProperties;
    hooks?: ReactiveAdapter.Hooks;
    options?: ReactiveAdapter.Options;
  }) {
    this.#hooks = hooks ?? {};
    this.#isPropertyUpdating$ = createReference(false);
    this.#propValues = new Map<keyof Props, unknown>();
    this.#reactiveProperties = reactiveProperties;
    this.#reactivePropertyEmitter = new EventStation<EventListeners>();
    this.#updateMode = options?.updateMode ?? ReactiveUpdateMode.Reactive;
    this.isPropertyUpdating$ = this.#isPropertyUpdating$.asReadonly();

    queueMicrotask(() => {
      // We can safely assume that the host object is fully constructed
      // after a microtask has been queued, because all objects are
      // constructed synchronously.
      this.#isConstructed = true;

      // Sync attribute values after the element is constructed.
      // This is to ensure that the attributes are set after the element
      // is fully constructed, and not during the construction phase.
      this.syncAttributeValues();
    });
  }

  /**
   * Get the value of a reactive property.
   */
  getProp<K extends keyof Props>(name: K): Props[K] | undefined {
    const config = this._findPropConfig(name);

    if (!config) {
      throw new Error(`Property "${String(name)}" is not a reactive property.`);
    }

    return this._getReactivePropertyValue(config) as Props[K] | undefined;
  }

  /**
   * Set the value of a reactive property.
   */
  setProp<K extends keyof Props>(name: K, value: Props[K]): void {
    const config = this._findPropConfig(name as keyof Props);

    if (!config) {
      throw new Error(`Property "${String(name)}" is not a reactive property.`);
    }

    this._setReactivePropertyValue(
      ReactivePropertyChangeOrigin.Property,
      config,
      value,
    );
  }

  /**
   * Set the values of multiple reactive properties at once.
   */
  /*
   * ### Private Remarks
   *
   * This is a convenience method that allows you to set multiple
   * reactive properties at once. It will iterate over the provided
   * properties and set each one using the `setProp` method.
   */
  setProps(props: Partial<Props>): void {
    for (const [propertyName, nextValue] of Object.entries(props)) {
      this.setProp(propertyName, nextValue);
    }
  }

  /**
   * Create an observable that emits property changes
   */
  // TODO: Constrain property names to reactive properties.
  observePropChange<
    K extends keyof Props = keyof Props,
    T extends Props[K] = Props[K],
  >(): Observable.WithSubscription<PropertyChangePayload<K, T>> {
    // NOTE: This is intentionally not a `Reference` type,
    // because it is not a stateful reference, but rather an observable
    // that emits property change events.
    const changeSignals = Beacon.withEmitter<PropertyChangePayload<K, T>>();
    const listenerSubscription = this.onPropChange<K, T>((payload) => {
      changeSignals.next(payload);
    });
    const subscription: Subscription = {
      unsubscribe: () => {
        // First, unsubscribe from the property change listener.
        // This will prevent the listener from emitting any more events.
        listenerSubscription.unsubscribe();
        // Then, complete the property change observable.
        // This will emit a completion signal to all subscribers,
        // and terminate the observable.
        changeSignals.complete();
      },
    };

    return Object.assign(changeSignals.beacon, { subscription });
  }

  /**
   * @internal scope: package
   */
  _findPropConfig<K extends keyof Props>(
    propertyName: K,
  ): ReactiveProperty | undefined {
    return this.#reactiveProperties.find(
      ({ propertyName: configPropertyName }) =>
        configPropertyName === propertyName,
    );
  }

  /**
   * Create a reference to a reactive property value.
   *
   * @remarks
   *
   * This method is used to create a reference to a reactive property value
   * that will automatically update when the property value changes.
   */
  /*
   * ### Private Remarks
   *
   * This method intentionally doesn't accept an "initialValue",
   * because the initial value is determined by the current
   * value of the property. This is to ensure that the reference
   * is always in sync with the property value.
   */
  refProp<K extends keyof Props>(
    propertyName: K,
  ): Reference.WithSubscription<Props[K]>;

  refProp<K extends keyof Props, T>(
    propertyName: K,
    transform: (value: Props[K]) => T,
  ): Reference.SubscriberRetaining<T, Props[K]>;

  refProp<K extends keyof Props>(
    propertyName: K,
    fallback: NonNullable<Props[K]> extends (...args: any[]) => any
      ? never
      : NonNullable<Props[K]>,
  ): Reference.SubscriberRetaining<NonNullable<Props[K]>, Props[K]>;

  refProp<K extends keyof Props, T>(
    propertyName: K,
    arg1?: NonNullable<Props[K]> | ((value: Props[K]) => T),
  ):
    | Reference.WithSubscription<Props[K]>
    | Reference.SubscriberRetaining<NonNullable<Props[K]>, Props[K]>
    | Reference.SubscriberRetaining<T, Props[K]> {
    const prop$ = this._refPropOnly(propertyName);

    if (
      // While we could check if `arg1` is null or undefined,
      // it's more reliable to check the number of arguments,
      // for handling overloaded methods.
      arguments.length === 1
    ) {
      return prop$;
    }

    if (arg1 == null) {
      throw new Error(
        "The second argument must be a transform function or a fallback value.",
      );
    }

    const transform =
      typeof arg1 === "function"
        ? // If `arg1` is a function, use it as the transform function.
          arg1
        : // If `arg1` is not a function, use it as a fallback value.
          (value: Props[K]) => value ?? arg1;

    return mapRef(prop$, transform);
  }

  _refPropOnly<K extends keyof Props>(
    propertyName: K,
  ): Reference.WithSubscription<Props[K]> {
    const config = this._findPropConfig(propertyName);

    if (!config) {
      throw new Error(
        `Property "${String(propertyName)}" is not a reactive property.`,
      );
    }

    type Value = Props[K];

    /**
     * A reference used to observe changes to the property.
     */
    /*
     * ### Private Remarks
     *
     * This shouldn't use `hold`, because it doesn't need
     * to request an update on the host. `KnytElement` will request
     * an update when the property changes.
     */
    const initialValue = this.getProp(propertyName) as Value;

    const value$ = createReference(initialValue, {
      comparator: config.comparator,
    });

    const subscription = this.onPropChange(propertyName, (currentValue) => {
      value$.set(currentValue);
    });

    // We're replacing the mutator to so that the property is updated
    // instead of the reference value. When the property is updated,
    // the new value will propagate to the reference via the
    // `onPropChange` handler.
    const modifiedRef = replaceReferenceMutator(
      value$,
      (_origin$) => (nextValue: Value) => {
        // Ignore the origin reference (`_origin$`), and just set the property directly
        // using the reactive adapter.
        this._setReactivePropertyValue(
          ReactivePropertyChangeOrigin.Property,
          config,
          nextValue,
        );
      },
    );

    return Object.assign(modifiedRef, { subscription });
  }

  /**
   * Subscribe to property changes on the element.
   *
   * @beta
   */
  /*
   * ### Private Remarks
   *
   * This method is intended to be used by the element itself to listen to property changes for internal logic,
   * but it is public, because it is intended to be used by the element's controllers,
   * and due to the limitations of TypeScript's access control.
   */
  onPropChange<K extends keyof Props>(
    propertyName: K,
    callback: (currentValue: Props[K], previousValue: Props[K]) => void,
  ): Subscription;

  // TODO: Restrict property names to reactive properties.
  onPropChange<
    K extends keyof Props = keyof Props,
    T extends Props[K] = Props[K],
  >(listener: (payload: PropertyChangePayload<K, T>) => void): Subscription;

  onPropChange<K extends keyof Props>(
    arg1: keyof Props | ((event: PropertyChangePayload<K, Props[K]>) => void),
    arg2?: (
      currentValue: Props[keyof Props],
      previousValue: Props[keyof Props],
    ) => void,
  ): Subscription {
    let listeners: Listeners<EventListeners>;

    if (typeof arg1 === "function") {
      const listener = arg1;

      listeners = this.#reactivePropertyEmitter.on(
        PropertyChangeEventName,
        (event: PropertyChangePayload<K, Props[K]>) => {
          listener(event);
        },
      );
    } else if (typeof arg2 === "function") {
      const propertyName = arg1;
      const listener = arg2;

      listeners = this.#reactivePropertyEmitter.on(
        PropertyChangeEventName,
        (event: PropertyChangePayload<K, Props[K]>) => {
          if (event.propertyName === propertyName) {
            listener(event.currentValue, event.previousValue);
          }
        },
      );
    } else {
      throw new Error("Invalid arguments");
    }

    return {
      unsubscribe() {
        listeners.off();
      },
    };
  }

  /**
   * Set a reactive property value from a property setter or an attribute change.
   */
  _setReactivePropertyValue<T extends ReactiveProperty>(
    changeOrigin: ReactivePropertyChangeOrigin,
    config: T,
    nextValue: PropertyDefinition.ToValue<T> | undefined,
  ): void {
    const {
      attributeName,
      propertyName,
      toAttributeValue = unknownToAttributeValue,
      comparator = strictEqual,
    } = config;

    this.#isPropertyUpdating$.set(true);

    const previousValue = this.#propValues.get(propertyName) as T | undefined;

    // The next value is always set, regardless of the comparator.
    // The comparator is used to determine if change notification
    // should be emitted. Mutating the current property value is a
    // separate concern that is not related to the comparator.
    this.#propValues.set(propertyName, nextValue);

    const isElementConnected = this.#hooks.isConnected;
    const isElementConstructed = this.#isConstructed;

    if (
      attributeName &&
      // The DOM doesn't allow setting attributes on an element
      // while it is being constructed, so we only set attributes
      // when the element is finished constructing.
      isElementConstructed &&
      changeOrigin === ReactivePropertyChangeOrigin.Property
    ) {
      const nextAttributeValue = toAttributeValue(nextValue);
      // The source of truth is the property, so we reference the attribute value
      // by converting the property value to an attribute value.
      const prevAttributeValue = toAttributeValue(previousValue);

      if (nextAttributeValue === null) {
        this.#hooks.removeAttribute?.(attributeName);
      } else if (nextAttributeValue !== prevAttributeValue) {
        this.#hooks.setAttribute?.(attributeName, nextAttributeValue);
      }
    }

    if (!comparator(previousValue, nextValue)) {
      const changedProperties = this.#changedProperties;

      for (const hookName of hookNames) {
        changedProperties[hookName].set(propertyName, nextValue);
      }

      // Emit a property change event first, before requesting an update.
      //
      // All side effects are asynchronous, so we need to wait for the next
      // microtask to request the update.
      queueMicrotask(() => {
        this.#reactivePropertyEmitter.emit(PropertyChangeEventName, {
          currentValue: nextValue,
          previousValue,
          propertyName,
        });
      });

      if (
        // Updates are only requested when the element is connected to the DOM,
        // because:
        //
        // > The specification recommends that, as far as possible, developers
        // > should implement custom element setup in this callback (`connectedCallback`)
        // > rather than the constructor.
        // > https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#custom_element_lifecycle_callbacks
        //
        // While it's ultimately the responsibility of the element to determine
        // a requested update should be applied, we can avoid unnecessary
        // operations by only requesting updates when the element is connected
        // to the DOM.
        isElementConnected &&
        this.#updateMode === ReactiveUpdateMode.Reactive
      ) {
        // All side effects are asynchronous, so we need to wait for the next
        // microtask to request the update.
        //
        // !!! Important !!!
        //
        // This is used to prevent updates from occurring when the element
        // is connected to the DOM due to a declarative shadow DOM being
        // used.
        //
        // When a declarative shadow DOM is used, an element will already be
        // connected to the DOM while its being constructed. As a result,
        // if it receives updates (via observed attributes, etc.), updates may
        // be requested in the middle of the element's constructor.
        //
        // This is a significant issue, because an element isn't considered ready
        // to handle updates until after the extended constructor has fully
        // completed its execution.
        queueMicrotask(() => {
          this.#hooks.requestUpdate?.();
        });
      }
    }

    this.#isPropertyUpdating$.set(false);
  }

  /**
   * Get a reactive property value.
   *
   * @internal scope: package
   */
  _getReactivePropertyValue<T extends ReactiveProperty>(
    config: T,
  ): PropertyDefinition.ToValue<T> | undefined {
    return this.#propValues.get(config.propertyName) as
      | PropertyDefinition.ToValue<T>
      | undefined;
  }

  /**
   * Retrieves the changed properties since the last call to this method,
   * and resets the changed properties map.
   */
  _flushChangedProperties(hookName: `${HookName}`): BoundMap.Readonly<any> {
    const changedProperties = this.#changedProperties[hookName];

    this.#changedProperties[hookName] = new Map();

    return changedProperties as BoundMap.Readonly<any>;
  }

  /**
   * Get all reactive property values as an object.
   *
   * @remarks
   * Useful for accessing multiple properties at once. For best type safety,
   * prefer accessing individual properties directly.
   *
   * @public
   */
  getProps(): Props {
    return Object.fromEntries(this.#propValues) as Props;
  }

  /**
   * Set the attribute values from reactive properties that have attribute names.
   *
   * @remarks
   *
   * While this method can technically be called at any time, it is primarily
   * intended to be called after the host has been fully constructed. This is
   * because attributes cannot be set on an element during its construction phase,
   * and doing so will result in the browser throwing an error.
   */
  /*
   * ### Private Remarks
   *
   * This method exists, because attributes can not be set in the constructor.
   * Doing so will result in the browser throwing an error.
   * As a result, we must set attribute values after the element is connected.
   *
   * @internal scope: package
   */
  syncAttributeValues(): void {
    this.setAttributeValues(this.getAttributeValues());
  }

  /**
   * Creates a dictionary of attribute names and their corresponding values
   * based on the reactive properties that have an associated attribute name.
   */
  getAttributeValues(): Record<string, DOMAttributeValue> {
    const attributeValues: Record<string, DOMAttributeValue> = {};

    for (const config of this.#reactiveProperties) {
      const {
        attributeName,
        propertyName,
        toAttributeValue = unknownToAttributeValue,
      } = config;

      if (!attributeName) continue;

      const propertyValue = this.#propValues.get(propertyName);
      const attributeValue = toAttributeValue(propertyValue);

      attributeValues[attributeName] = attributeValue;
    }

    return attributeValues;
  }

  /**
   * Set attribute values on the element using the provided attribute values
   * using the hooks defined in the constructor.
   */
  setAttributeValues(attributeValues: Record<string, DOMAttributeValue>): void {
    for (const attributeName in attributeValues) {
      const attributeValue = attributeValues[attributeName];

      if (attributeValue === null) {
        this.#hooks.removeAttribute?.(attributeName);
      } else {
        this.#hooks.setAttribute?.(attributeName, attributeValue);
      }
    }
  }

  /**
   * @internal scope: package
   */
  _setPropertyFromAttributeChange(
    name: string,
    _prevAttributeValue: DOMAttributeValue,
    nextAttributeValue: DOMAttributeValue,
  ) {
    const propertyConfig = this.#reactiveProperties.find(
      ({ attributeName }) => attributeName === name,
    );

    if (!propertyConfig) return;

    const toPropertyValue =
      propertyConfig.toPropertyValue ?? attributeValueToString;
    const nextValue = toPropertyValue(nextAttributeValue);

    this._setReactivePropertyValue(
      ReactivePropertyChangeOrigin.Attribute,
      propertyConfig,
      nextValue,
    );
  }

  /**
   * Creates a reference that maps a property value to a transformed value.
   *
   * @deprecated Use `mapRef` instead.
   */
  mapProp<P extends keyof Props, T>(
    propertyName: P,
    transform: (value: Props[P]) => T,
  ): Reference.SubscriberRetaining<T, Props[P]> {
    return mapRef<T, Props[P]>({
      origin: this.refProp(propertyName),
      transform,
    });
  }

  /**
   * @deprecated Use `unwrapRef` instead.
   */
  unwrapProp<K extends keyof Props>(
    propertyName: K,
  ): Reference.Unwrapped<UnwrapRef<Props[K]> | undefined> {
    return unwrapRef(this.refProp<K>(propertyName));
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
   */
  handleAttributeChanged(
    name: string,
    previousValue: DOMAttributeValue,
    nextValue: DOMAttributeValue,
  ) {
    // To avoid unnecessary updates when a property is associated with an attribute,
    // we prevent attribute updates while a property is being updated.
    // This is because the property setter will handle the attribute update,
    // and attributes are synchronous.
    if (!this.isPropertyUpdating$.get()) {
      this._setPropertyFromAttributeChange(name, previousValue, nextValue);
    }
  }
}

export namespace ReactiveAdapter {
  export type Options = {
    updateMode?: `${ReactiveUpdateMode}`;
  };

  /**
   * A set of hooks that can be used to interact with the element.
   *
   * @remarks
   *
   * These hooks are used to interact with the element in a way that is
   * compatible with the reactive adapter. They are used to perform actions
   * such as setting attributes, removing attributes, and requesting updates.
   *
   * @internal scope: package
   */
  /*
   * ### Private Remarks
   *
   * This API is designed in a way that a `KnytElement` can be
   * dropped in without modification to fulfill the contract.
   */
  export type Hooks = {
    isConnected?: HTMLElement["isConnected"];
    removeAttribute?: HTMLElement["removeAttribute"];
    setAttribute?: HTMLElement["setAttribute"];
    requestUpdate?: ReactiveControllerHost["requestUpdate"];
  };
}

/**
 * Determines whether the input is a {@link ReactiveAdapter}.
 */
export function isReactiveAdapter(value: unknown): value is ReactiveAdapter {
  return (
    isNonNullableObject(value) &&
    "_findPropConfig" in value &&
    typeof (value as ReactiveAdapter)["_findPropConfig"] === "function" &&
    "_setReactivePropertyValue" in value &&
    typeof (value as ReactiveAdapter)["_setReactivePropertyValue"] ===
      "function" &&
    "_getReactivePropertyValue" in value &&
    typeof (value as ReactiveAdapter)["_getReactivePropertyValue"] ===
      "function"
  );
}

/**
 * Determines whether the input is a {@link Reactive}.
 */
export function isReactive(value: unknown): value is Reactive {
  return (
    isNonNullableObject(value) &&
    __reactiveAdapter in value &&
    isReactiveAdapter(value[__reactiveAdapter])
  );
}

/**
 * Retrieves the reactive adapter from an object.
 *
 * @returns The reactive adapter if the object is reactive,
 * otherwise `undefined`.
 *
 * @internal scope: package
 */
export function getReactiveAdapter(
  value: unknown,
): ReactiveAdapter | undefined {
  if (isReactive(value)) {
    return value[__reactiveAdapter];
  }

  return undefined;
}

/**
 * Assert that the object is a {@link Reactive}.
 */
export function assertReactive(value: unknown): asserts value is Reactive {
  if (!isReactive(value)) {
    throw new TypeError("Object is not reactive");
  }
}

/**
 * Defines reactive properties on a given object.
 */
export function makeReactive<T extends object, B>(
  targetObj: T,
  properties: PropertiesDefinition<B>,
): ReactiveProperties {
  const reactiveProperties = convertPropertiesDefinition(properties);

  for (const config of reactiveProperties) {
    Object.defineProperty(targetObj, config.propertyName, {
      get(this: Reactive) {
        // TODO: Remove in production
        assertReactive(this);

        return this[__reactiveAdapter]._getReactivePropertyValue(config);
      },
      set(this: Reactive, nextValue: unknown) {
        // TODO: Remove in production
        assertReactive(this);

        this[__reactiveAdapter]._setReactivePropertyValue(
          ReactivePropertyChangeOrigin.Property,
          config,
          nextValue,
        );
      },
    });
  }

  return reactiveProperties;
}

/**
 * Adds reactivity to an instance of a class.
 *
 * @remarks
 *
 * Although the function works on class instances, it modifies the prototype of the class.
 * The prototype is modified only once, so all instances of the class will have the same reactive properties.
 * The trade-off is miniscule overhead to check if the prototype has already been modified
 * on each instance creation.
 */
/*
 * ### Private Remarks
 *
 * The reason why this is performed at construction time is because `properties` are typically
 * store statically on the class constructor. If we were to perform this when the class is defined,
 * then we would need to apply the mixin to every class.
 *
 * For example, instead of the API looking like this:
 *
 * ```ts
 * class MyElement extends KnytElement {
 *   static properties = {};
 * }
 * ```
 *
 * It would have to look something like this:
 *
 * ```ts
 * const properties = {};
 *
 * class MyElement extends KnytMixin(HTMLElement, properties) {}
 * ```
 *
 * While that's not a bad API, TypeScript doesn't like it.
 * TypeScript also treats `HTMLElement` specially. Writing anything
 * other than `extends HTMLElement` breaks the type system for
 * some reason. Maybe it's a bug, maybe it's a feature.
 */
export function withReactivity<T extends object, P>({
  instance,
  properties,
  hooks,
  options,
}: {
  instance: T;
  properties: PropertiesDefinition<P>;
  hooks?: ReactiveAdapter.Hooks;
  options?: ReactiveAdapter.Options;
}): void {
  const proto = Object.getPrototypeOf(instance);

  let reactiveProperties: ReactiveProperties;

  if (Object.hasOwn(proto, __reactiveProperties)) {
    // Reactive properties have already been prepared.
    reactiveProperties = (proto as ReactiveInternal)[__reactiveProperties];
  } else {
    reactiveProperties = makeReactive(proto, properties);

    Object.defineProperty(proto, __reactiveProperties, {
      get() {
        return reactiveProperties;
      },
    });
  }

  (instance as Reactive)[__reactiveAdapter] = new ReactiveAdapter({
    reactiveProperties,
    hooks,
    options,
  });
}

type MixableMemberName = ObjectToFunctionPropertyNames<ReactiveAdapter>;

function attachReactiveMembers(
  targetObj: object,
  members: MixableMemberName[] = [],
): void {
  for (const memberName of members) {
    if (typeof ReactiveAdapter.prototype[memberName] !== "function") {
      throw new Error(
        `Method "${memberName}" does not exist on the ReactiveAdapter prototype.`,
      );
    }
    if (memberName in targetObj) {
      throw new Error(
        `Member "${memberName}" already exists on the prototype. Please rename the member.`,
      );
    }

    (targetObj as any)[memberName] = function (...args: any[]): any {
      // TODO: Remove in production.
      assertReactive(this);

      return (this[__reactiveAdapter] as any)[memberName](...args);
    };
  }
}

const mixedConstructors = new WeakSet<{
  prototype: object;
}>();

export function applyReactiveMixin<
  T extends {
    prototype: object;
  },
>(Constructor: T, members: MixableMemberName[] = []): void {
  if (mixedConstructors.has(Constructor)) return;

  mixedConstructors.add(Constructor);

  const proto = Constructor.prototype;

  attachReactiveMembers(proto, members);
}
