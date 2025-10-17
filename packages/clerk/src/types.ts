import type { Reference, Subscription } from "@knyt/artisan";

import type {
  Action,
  ActionCreator,
  AnyAction,
  BoundActionCreator,
} from "./action/fsa.ts";

export type { Action, ActionCreator, AnyAction, BoundActionCreator };

/**
 * A function that listens for changes to a value.
 *
 * @public
 */
/*
 * ### Private Remarks
 *
 * This should not be combined with `Reference.UpdateHandler`, because
 * the `previousValue` is always defined, and the return type is `void`.
 */
export type Listener<T> = (currentValue: T, previousValue: T) => void;

/**
 * A function that selects a value from a state.
 *
 * @public
 */
export type Selector<S, T> = (state: S) => T;

/**
 * A function that subscribes to value changes.
 *
 * @public
 */
export type SubscriptionFactory<T> = (
  listener: Listener<T>,
) => Subscription.SubscriberRetaining<T>;

/**
 * A function that creates a reference to a value in the store
 * that updates when the selected state changes.
 *
 * @public
 */
export type StoreReferenceFactory<S, T> = (
  onUpdate?: Reference.UpdateHandler<T>,
) => Reference.SubscriberRetaining<T, S>;

/**
 * @public
 */
export type Collection<T> = readonly Readonly<T>[];

export type AsyncAction<TStore> = (store: TStore) => Promise<void>;

export type Dispatch<TStore> = {
  (action: AnyAction): void;
  (asyncAction: AsyncAction<TStore>): Promise<void>;
};
