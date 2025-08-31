import {
  BasicReference,
  Beacon,
  mapRef,
  sequentialPairs,
  strictEqual,
  subscribeWithRetention,
  type Observable,
  type Reference,
  type Subscription,
} from "@knyt/artisan";

import {
  actionCreatorFactory,
  isAction,
  type ActionCreatorFactory,
  type BoundActionCreator,
} from "./action/fsa";
import {
  createAccessor,
  type ReferenceAccessor,
  type SelectorDictionary,
} from "./createAccessor";
import { logDispatch } from "./logDispatch";
import type {
  Action,
  AnyAction,
  Dispatch,
  Listener,
  Selector,
  SubscriptionFactory,
} from "./types";

/**
 * An `Reference` that can dispatch actions to update its state.
 */
export class Store<S> extends BasicReference<S> {
  /**
   * The current state of the store.
   *
   * @deprecated Use `value` instead.
   * @internal scope: workspace
   */
  get state(): Readonly<S> {
    return this.value;
  }

  /**
   * An observable that emits actions that have been dispatched to the store.
   *
   * @remarks
   *
   * This is intentionally not a `Reference`, but a `Beacon`,
   * because references emit the current value immediately upon subscription,
   * while beacons only emit a stream of values.
   *
   * We don't want to emit "the last dispatched action", we want to subscribe
   * future dispatched actions.
   */
  #actionSignals = Beacon.withEmitter<AnyAction>();

  /**
   * An observable that emits actions that have been dispatched to the store.
   *
   * @public
   */
  get action$(): Observable<AnyAction> {
    return this.#actionSignals.beacon;
  }

  /**
   * Enable debug logging for dispatches.
   *
   * @public
   */
  debug: boolean;

  /**
   * The action creator factory used to create action creators.
   */
  #createActionCreator: ActionCreatorFactory;

  constructor(initialState: S, options: Store.Options<S> = {}) {
    const { onUpdate, comparator, debug, actionPrefix } = options;

    super({
      initialValue: initialState,
      onUpdate,
      comparator,
    });

    this.#createActionCreator = actionCreatorFactory(actionPrefix);
    this.debug = debug ?? false;
  }

  #actionReducers: Partial<
    Record<AnyAction["type"], (this: this, state: S, action: Action<any>) => S>
  > = {};

  /**
   * Dispatch an action to update the store's state.
   *
   * @detachable
   * @public
   */
  /*
   * ### Private Remarks
   *
   * The method is not readonly, so that it may be overridden.
   * It is also an arrow function so that it may be passed
   * around as a callback without losing its context.
   *
   * All side effects must be queued as microtasks.
   *
   * No batching is performed; i.e. all reducers and subscribers receive every action/update.
   */
  dispatch: Dispatch<this> = (input) => {
    if (typeof input === "function") {
      // Type cast to `any` avoids unhelpful type error
      // for the `Dispatch` overload return types.
      return input(this) as any;
    }

    this.#dispatchAction(input);
  };

  #dispatchAction(action: AnyAction): void {
    const prevState = this.value;

    let nextState = this.value;

    if (isAction(action)) {
      const matchingReducer = this.#actionReducers[action.type];

      if (matchingReducer) {
        nextState = matchingReducer.apply(this, [nextState, action]);
      }
    }
    if (this.reduce) {
      nextState = this.reduce(nextState, action);
    }

    this.value = nextState;

    // All store side effects are asynchronous,
    // so they must be queued as microtasks.
    queueMicrotask(() => {
      // NOTE: This is not a `Reference`, but a `Beacon`.
      // `Beacon` emitter methods are synchronous, so we
      // must emit after a microtask to make the side effect
      // asynchronous.
      this.#actionSignals.next(action);

      if (this.debug) {
        logDispatch({
          action,
          nextState,
          prevState,
        });
      }
    });
  }

  /**
   * Subscribe to changes to a selected value from the store's state.
   * The listener will only be called when the selected value changes.
   *
   * @deprecated Use `ref` instead.
   * @internal scope: workspace
   */
  #subscribeToSelector<T>(
    listener: Listener<T>,
    selector: Selector<S, T>,
    comparator: (a: T, b: T) => boolean = strictEqual,
  ): Subscription.SubscriberRetaining<T> {
    const initialValue = selector(this.value);
    const observer = sequentialPairs(
      initialValue,
      ([previousValue, currentValue]) => listener(currentValue, previousValue),
    );
    const selectedState$ = this.ref(selector, comparator);

    return subscribeWithRetention(selectedState$, observer);
  }

  /**
   * Bind an action creator to the store's dispatch method..
   *
   * @deprecated Use `createAction` or `createActions` instead.
   * @internal scope: workspace
   */
  // TODO: Make this private and only expose `createAction` and `createActions`.
  bindActionCreator<T>(
    actionCreator: (payload: T) => Action<T>,
  ): (payload: T) => void {
    return (payload: T) => this.dispatch(actionCreator(payload));
  }

  #createBoundAction<Payload>(type: string): BoundActionCreator<Payload> {
    const actionCreator = this.#createActionCreator<Payload>(type);
    const boundActionCreator = this.bindActionCreator(actionCreator);

    return Object.assign(boundActionCreator, {
      match: actionCreator.match,
      type: actionCreator.type,
    });
  }

  /**
   * Create an action creator that can be dispatched to
   * update the store's state using the given reducer.
   *
   * @public
   */
  createAction<P>(
    type: string,
    reducer: (this: this, state: S, action: Action<P>) => S,
  ): BoundActionCreator<P> {
    this.#actionReducers[type] = reducer;

    return this.#createBoundAction<P>(type);
  }

  /**
   * Create a set of action creators that can be dispatched to update the store's state.
   *
   * @public
   */
  createActions<
    Reducers extends Record<
      string,
      (this: this, state: S, action: Action<any>) => S
    >,
  >(
    reducers: Reducers,
  ): {
    [K in keyof Reducers]: BoundActionCreator<
      Parameters<Reducers[K]>[1]["payload"]
    >;
  } {
    const actionCreators = {} as any;

    for (const type in reducers) {
      actionCreators[type] = this.createAction(type, reducers[type]);
    }

    return actionCreators;
  }

  /**
   * Define a selector that selects a value from the store's state.
   *
   * @detachable
   *
   * @deprecated
   */
  /*
   * ### Private Remarks
   *
   * This is a simple no-op method for convenience, that helps
   * to define the type of the selector.
   */
  defineSelector<T>(selector: Selector<S, T>): Selector<S, T> {
    return selector;
  }

  /**
   * A set of selectors for each property in the store's state.
   *
   * @public
   */
  readonly selectors: {
    readonly [K in keyof S as K extends string ? K : never]-?: Selector<
      S,
      S[K]
    >;
  } = new Proxy(
    {},
    {
      get(_target, property: string) {
        return (state: S) => state[property as keyof S];
      },
    },
  ) as any;

  /**
   * Create an accessor that provides access to selected values from the store's state.
   *
   * @public
   */
  createAccessor<T extends SelectorDictionary<S>>(
    input: T,
  ): ReferenceAccessor<T> {
    return createAccessor(this, input);
  }

  /**
   * Define a selector that selects a property from the store's state.
   *
   * @detachable
   *
   * @deprecated Use `selectors` instead.
   */
  propertySelector = <K extends keyof S>(
    propertyName: K,
  ): Selector<S, S[K]> => {
    return (state: S) => state[propertyName];
  };

  /**
   * Create a subscription provider that creates subscriptions for a selected value from the store's state.
   *
   * @deprecated Use `ref` instead.
   * @internal scope: workspace
   */
  createSubscriptionFactory<T>(
    selector: Selector<S, T>,
    comparator?: (a: T, b: T) => boolean,
  ): SubscriptionFactory<T> {
    return (listener) => {
      return this.#subscribeToSelector(listener, selector, comparator);
    };
  }

  /**
   * Create a  reference that observes a selected value from the store's state.
   *
   * @deprecated Use `createAccessor` instead.
   * @internal scope: workspace
   * TODO: Make this private
   */
  /*
   * ### Private Remarks
   *
   * The method doesn't have the `onUpdate` parameter,
   * because there should be no need to create side
   * effects in a store, and consumers should use the
   * observable's `subscribe` method instead.
   */
  ref<T>(
    selector: Selector<S, T>,
    comparator?: (a: T, b: T) => boolean,
  ): Reference.SubscriberRetaining<T, S> {
    return mapRef({
      origin: this,
      transform: selector,
      comparator,
    });
  }

  /**
   * Reduces the store's current state and a given action.
   *
   * @remarks
   *
   * It's recommended to use `createActions` to define action reducers instead.
   * This method is provided for compatibility with legacy code.
   *
   * @public
   */
  reduce?(state: S, action: AnyAction): S;
}

export namespace Store {
  // Re-export types from `typescript-fsa` for convenience.
  export type Action<T> = import("./action/fsa").Action<T>;

  export type Options<S> = {
    /**
     * A callback that is called when the state is updated.
     * It receives the current state and the previous state as arguments.
     *
     * @see {@link Reference.UpdateHandler}
     */
    onUpdate?: Reference.UpdateHandler<S>;
    /**
     * A comparator function that is used to compare the current state
     * and the next state. If the comparator returns `true`, the value
     * is not updated and no subscribers are notified.
     */
    comparator?: Reference.Comparator<S>;
    /**
     * Enable debug logging for dispatches.
     */
    debug?: boolean;
    /**
     * The prefix to use for action types.
     */
    actionPrefix?: string;
  };
}
