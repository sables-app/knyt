import type { Action } from "../types";

/**
 * Removes an item from an array and returns a new array.
 * If the item is not found, the original array is returned.
 *
 * @public
 */

export function removeElement<T>(
  array: ReadonlyArray<T>,
  predicate: (item: T) => boolean,
): ReadonlyArray<T>;

export function removeElement<T>(
  array: ReadonlyArray<T> | undefined,
  predicate: (item: T) => boolean,
): ReadonlyArray<T> | undefined;

export function removeElement<T>(
  array: ReadonlyArray<T> | undefined,
  predicate: (item: T) => boolean,
): ReadonlyArray<T> | undefined {
  if (!array) return undefined;

  const index = array.findIndex(predicate);

  if (index === -1) return array;

  return array.toSpliced(index, 1);
}

/**
 * Updates an element within an array and returns a new array.
 * If the element is not found, or if the element is the same as the new value,
 * the original array is returned.
 *
 * @public
 */

export function updateElement<T>(
  array: ReadonlyArray<T>,
  predicate: (item: T) => boolean,
  update: (item: T) => T,
): ReadonlyArray<T>;

export function updateElement<T>(
  array: ReadonlyArray<T> | undefined,
  predicate: (item: T) => boolean,
  update: (item: T) => T,
): ReadonlyArray<T> | undefined;

export function updateElement<T>(
  array: ReadonlyArray<T> | undefined,
  predicate: (item: T) => boolean,
  update: (item: T) => T,
): ReadonlyArray<T> | undefined {
  if (!array) return undefined;

  const index = array.findIndex(predicate);

  if (index === -1) return array;

  const currentValue = array[index];
  const newValue = update(currentValue);

  if (currentValue === newValue) return array;

  return array.toSpliced(index, 1, newValue);
}

/**
 * Clones an array and appends items to it.
 *
 * @public
 */
export function appendElement<T>(
  array: ReadonlyArray<T> | undefined,
  ...items: T[]
): ReadonlyArray<T> {
  return (array ?? []).concat(items);
}

/**
 * Clones an array and prepends items to it.
 *
 * @public
 */
export function prependElement<T>(
  array: ReadonlyArray<T> | undefined,
  ...items: T[]
): ReadonlyArray<T> {
  return (array ?? []).toSpliced(0, 0, ...items);
}

/**
 * Searches for an entity in an array using a provided ID selector,
 * and if found, removes it from the array, otherwise returns the
 * original array.
 *
 * @public
 */
export function removeEntityElement<T, U>(
  array: ReadonlyArray<T>,
  getId: (entity: T) => U,
  idToRemove: U,
): ReadonlyArray<T> {
  return removeElement(array, (entity) => getId(entity) === idToRemove);
}

/**
 * Swaps two elements in an array and returns a new array.
 * If the indices are the same or out of bounds, the original array is returned.
 *
 * @public
 */
export function swapElements<T>(
  array: ReadonlyArray<T>,
  indexA: number,
  indexB: number,
): ReadonlyArray<T> {
  if (indexA === indexB || !(indexA in array) || !(indexB in array)) {
    return array;
  }

  // Clone the array; `slice` is (by far) the fastest way to do this
  const result = array.slice();
  const valueA = result[indexA];

  result[indexA] = result[indexB];
  result[indexB] = valueA;

  return result;
}

/**
 * If the property's value is the same as the new value, return the state.
 * Otherwise, return a new state with the updated property.
 *
 * @public
 */
export function updateProperty<
  T extends Record<string | symbol, unknown>,
  K extends keyof T,
>(state: T, propertyName: K, nextValue: T[K]): T {
  const currentValue = state[propertyName];

  if (currentValue === nextValue) {
    return state;
  }

  return {
    ...state,
    [propertyName]: nextValue,
  };
}

/**
 * Represents the expected state of a store.
 *
 * @internal scope: package
 */
export type ExpectedState = Readonly<Record<string | symbol, unknown>>;

/**
 * A reducer function that takes the current state and an action,
 * and either returns a new state or the current state.
 *
 * @internal scope: package
 */
export type Reducer<S extends ExpectedState, P> = {
  (state: S, action: Action<P>): S;

  // onError: (errorReducer: Reducer<S, unknown>) => Reducer<S, P>;
};

/**
 * Reduce an action that updates a property in the state.
 *
 * @remarks
 *
 * If the property's value is the same as the new value, return the state.
 * Otherwise, return a new state with the updated property.
 *
 * Optionally provide a transform function to modify the new value
 * based on the current value and the action's payload.
 *
 * @public
 */
export function reduceToProperty<S extends ExpectedState>(
  propertyName: keyof S,
): Reducer<S, S[keyof S]>;

export function reduceToProperty<S extends ExpectedState, K extends keyof S, P>(
  propertyName: K,
  transformValue: (currentValue: S[K], payload: P) => S[K],
): Reducer<S, P>;

export function reduceToProperty<S extends ExpectedState, K extends keyof S>(
  propertyName: K,
  transformValue?: (currentValue: S[K], payload: unknown) => S[K],
): Reducer<S, unknown> {
  return (state, action) => {
    const payload = action.payload;
    const currentValue = state[propertyName];
    const nextValue = transformValue
      ? transformValue(currentValue, payload)
      : (payload as S[K]);

    return updateProperty(state, propertyName, nextValue);
  };
}

/**
 * A reducer that checks if an action has an error.
 *
 * @public
 */
export function reduceActionHasError<
  S extends ExpectedState,
  E extends Error,
>() {
  return (
    _state: S,
    action: Action<unknown>,
  ): action is Action.WithError<E> => {
    return !!action.error;
  };
}

/**
 * A reducer that checks if an action matches a predicate,
 * and applies one of two reducers based on the result.
 *
 * @public
 */
export function reduceBranch<S extends ExpectedState, TP, FP>(
  predicate: (state: S, action: Action<TP | FP>) => action is Action<TP>,
  trueReducer: Reducer<S, TP>,
  falseReducer: Reducer<S, FP>,
): Reducer<S, TP | FP> {
  return (state, action) => {
    if (predicate(state, action)) {
      return trueReducer(state, action);
    }

    return falseReducer(state, action as Action<FP>);
  };
}

/**
 * A reducer that applies a reducer for an action containing an error,
 * and another reducer for a successful action.
 *
 * @public
 */
export function reduceOnError<S extends ExpectedState, P, E extends Error>(
  errorReducer: Reducer<S, E>,
  reducer: Reducer<S, P>,
): Reducer<S, P | E> {
  return reduceBranch(reduceActionHasError(), errorReducer, reducer);
}

/**
 * A reducer that sets a given value to a property in the state.
 *
 * @public
 */
export function reduceToPropertyValue<
  S extends ExpectedState,
  K extends keyof S,
>(propertyName: K, value: (state: S) => S[K]): Reducer<S, void> {
  return (state) => updateProperty(state, propertyName, value(state));
}

/**
 * A reducer that sets a given value to a property in the state.
 *
 * @public
 */
export function reduceToValue<S extends ExpectedState, K extends keyof S>(
  propertyName: K,
  value: S,
): Reducer<S, void> {
  return (state) => (state === value ? state : value);
}
