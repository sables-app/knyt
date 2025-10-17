import type { Action } from "../types.ts";

/**
 * Removes an item from an array and returns a new array.
 * If the item is not found, the original array is returned.
 *
 * @public
 */
// TODO: Add support for `Set`
export function itemRemove<T>(
  array: ReadonlyArray<T>,
  predicate: (item: T) => boolean,
): ReadonlyArray<T>;

export function itemRemove<T>(
  array: ReadonlyArray<T> | undefined,
  predicate: (item: T) => boolean,
): ReadonlyArray<T> | undefined;

export function itemRemove<T>(
  array: ReadonlyArray<T> | undefined,
  predicate: (item: T) => boolean,
): ReadonlyArray<T> | undefined {
  if (!array) return undefined;

  const index = array.findIndex(predicate);

  if (index === -1) return array;

  return array.toSpliced(index, 1);
}

// TODO: Add support for `Set`
export function withItemRemove<T>(
  predicate: (item: T) => boolean,
): (array: ReadonlyArray<T> | undefined) => ReadonlyArray<T> | undefined {
  return (array) => itemRemove(array, predicate);
}

/**
 * Updates an element within an array and returns a new array.
 *
 * @remarks
 *
 * If the element is not found, or if the element is the same as the new value,
 * the original array is returned.
 *
 * @public
 */

export function itemUpdate<T>(
  array: ReadonlyArray<T>,
  predicate: (item: T) => boolean,
  update: (item: T) => T,
): ReadonlyArray<T>;

export function itemUpdate<T>(
  array: ReadonlyArray<T> | undefined,
  predicate: (item: T) => boolean,
  update: (item: T) => T,
): ReadonlyArray<T> | undefined;

export function itemUpdate<T>(
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
// TODO: Add support for `Set`
export function itemAppend<T>(
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
// TODO: Add support for `Set`
export function itemPrepend<T>(
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
// TODO: Add support for `Set` and `Map`
export function withEntityRemove<T extends { id: U }, U>() {
  return (collection: ReadonlyArray<T>, idToRemove: U): ReadonlyArray<T> => {
    return itemRemove(collection, (entity) => entity.id === idToRemove);
  };
}

/**
 * Swaps two elements in an array and returns a new array.
 * If the indices are the same or out of bounds, the original array is returned.
 *
 * @public
 */
// TODO: Add support for `Set`
export function itemSwap<T>(
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
export function propUpdate<
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
};

/**
 * Reduces an action into a boolean indicating if the action has an error.
 *
 * @public
 */
export function actionHasError<S extends ExpectedState, E extends Error>(
  _state: S,
  action: Action<unknown>,
): action is Action.WithError<E> {
  return !!action.error;
}

/**
 * A reducer that checks if an action matches a predicate,
 * and applies one of two reducers based on the result.
 *
 * @public
 */
export function withBranch<S extends ExpectedState, TP, FP>(
  predicate: (state: S, action: Action<TP | FP>) => action is Action<TP>,
  trueReducer: Reducer<S, TP>,
  falseReducer: Reducer<S, FP>,
): Reducer<S, TP | FP>;

export function withBranch<S extends ExpectedState, P>(
  predicate: (state: S, action: Action<P>) => boolean,
  trueReducer: Reducer<S, P>,
  falseReducer: Reducer<S, P>,
): Reducer<S, P>;

export function withBranch(
  predicate: (state: ExpectedState, action: Action<unknown>) => boolean,
  trueReducer: Reducer<ExpectedState, unknown>,
  falseReducer: Reducer<ExpectedState, unknown>,
): Reducer<ExpectedState, unknown> {
  return (state, action) => {
    if (predicate(state, action)) {
      return trueReducer(state, action);
    }

    return falseReducer(state, action as Action<unknown>);
  };
}

/**
 * A reducer that applies a reducer for an action containing an error,
 * and another reducer for a successful action.
 *
 * @public
 */
export function withErrorBranch<S extends ExpectedState, P, E extends Error>(
  errorReducer: Reducer<S, E>,
  reducer: Reducer<S, P>,
): Reducer<S, P | E> {
  return withBranch(actionHasError, errorReducer, reducer);
}

/**
 * A reducer that sets the action payload as the value of a specific property in the state.
 *
 * @remarks
 *
 * If the property's value is the same as the new value, return the state.
 * Otherwise, return a new state with the updated property.
 *
 * @public
 */
export function withPropSet<S extends ExpectedState, K extends keyof S>(
  propertyName: K,
): Reducer<S, S[K]>;

/**
 * A reducer that updates a specific property in the state,
 * using a function to compute the new value from the current state and action payload.
 *
 * @remarks
 *
 * If the property's value is the same as the new value, return the state.
 * Otherwise, return a new state with the updated property.
 *
 * @public
 */
export function withPropSet<S extends ExpectedState, K extends keyof S, P>(
  propertyName: K,
  getValue: (currentValue: S[K], payload: P) => S[K],
): Reducer<S, P>;

export function withPropSet<S extends ExpectedState, K extends keyof S, P>(
  propertyName: K,
  _getValue?: (currentValue: S[K], payload: P) => S[K],
): Reducer<S, P> {
  return (state, action) => {
    const getValue = _getValue ?? ((c: S[K], p: P) => p as S[K]);

    return propUpdate(
      state,
      propertyName,
      getValue(state[propertyName], action.payload),
    );
  };
}

// An alias for withPropSet that may be more intuitive in some contexts
export const toProp = withPropSet;

/**
 * A no-op utility that helps to define the type of a reducer.
 */
export function define<S, P, T = S>(
  reducer: (state: S, action: Action<P>) => T,
): (state: S, action: Action<P>) => T {
  return reducer;
}
