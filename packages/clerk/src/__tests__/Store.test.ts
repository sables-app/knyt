/// <reference types="bun-types" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import { reduce } from "../reduce/mod";
import { Store } from "../Store";
import { CounterStore, type CounterState } from "./CounterStore";

describe("Store", () => {
  let store: CounterStore;

  beforeEach(() => {
    store = new CounterStore();
  });

  it("should initialize with the correct state", () => {
    expect(store.value).toEqual({ count: 0 });
  });

  describe("createAction", () => {
    it("should increment the count", () => {
      store.incrementBy(2);

      expect(store.value).toEqual({ count: 2 });
    });

    it("should decrement the count", () => {
      store.decrementBy(2);

      expect(store.value).toEqual({ count: -2 });
    });

    it("should notify subscribers on state change", async () => {
      const subscriber = mock((state: CounterState) => {});

      store.subscribe(subscriber);

      // Not called, because side effects are asynchronous.
      expect(subscriber).not.toHaveBeenCalled();

      await Promise.resolve();

      // Called with the initial state when the subscriber is added.
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber.mock.calls[0][0]).toEqual({ count: 0 });

      store.incrementBy(3);

      // Not called, because side effects are asynchronous.
      expect(subscriber).toHaveBeenCalledTimes(1);

      await Promise.resolve();

      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber.mock.calls[1][0]).toEqual({ count: 3 });
    });
  });

  describe("dispatch", () => {
    it("should not notify subscribers if state does not change", () => {
      const subscriber = mock((state: CounterState) => {});

      store.subscribe(subscriber);
      store.dispatch({ type: "UNKNOWN_ACTION" });

      expect(subscriber).not.toHaveBeenCalled();
    });

    it("supports dispatching async actions", async () => {
      async function incrementTwiceOverTime(store: CounterStore) {
        store.incrementBy(5);
        await Promise.resolve();
        store.incrementBy(5);
      }

      expect(store.value).toEqual({ count: 0 });

      await store.dispatch(incrementTwiceOverTime);

      expect(store.value).toEqual({ count: 10 });
    });
  });

  describe("action$", () => {
    it("should emit actions when dispatched", async () => {
      const actionSubscriber = mock();

      const subscription = store.action$.subscribe(actionSubscriber);

      expect(actionSubscriber).not.toHaveBeenCalled();

      store.incrementBy(1);

      // Not called, because side effects are asynchronous.
      expect(actionSubscriber).not.toHaveBeenCalled();

      await Promise.resolve();

      // Called with the action when the action is dispatched.
      expect(actionSubscriber).toHaveBeenCalledTimes(1);
      expect(actionSubscriber).toHaveBeenLastCalledWith({
        type: "CounterStore/incrementBy",
        payload: 1,
      });

      store.decrementBy(2);

      expect(actionSubscriber).toHaveBeenCalledTimes(1);

      await Promise.resolve();

      expect(actionSubscriber).toHaveBeenCalledTimes(2);
      expect(actionSubscriber).toHaveBeenLastCalledWith({
        type: "decrementBy",
        payload: 2,
      });

      subscription.unsubscribe();

      store.incrementBy(1);
      await Promise.resolve();

      // Not called, because the subscription was unsubscribed.
      expect(actionSubscriber).toHaveBeenCalledTimes(2);
    });
  });

  describe("createSubscriptionFactory", () => {
    it("should support selector subscriptions", async () => {
      const listener = mock((count: number) => {});
      const selectCount = store.defineSelector((state) => state.count);
      const onCountChange = store.createSubscriptionFactory(selectCount);
      const subscription = onCountChange(listener);

      // Not called, because side effects are asynchronous.
      expect(listener).not.toHaveBeenCalled();

      await Promise.resolve();

      // Called with the initial state when the subscriber is added,
      // and again when the subscription is created.
      expect(listener).toHaveBeenCalledTimes(2);

      store.incrementBy(4);

      // Not called, because side effects are asynchronous.
      expect(listener).toHaveBeenCalledTimes(2);

      // Wait for the store subscriber to be called.
      await Promise.resolve();
      // Wait for the selector subscriber to be called.
      await Promise.resolve();

      expect(listener).toHaveBeenCalledTimes(3);

      subscription.unsubscribe();
      store.incrementBy(4);

      // Not called, because side effects are asynchronous.
      expect(listener).toHaveBeenCalledTimes(3);

      // Wait for the store subscriber to be called.
      await Promise.resolve();
      // Wait for the selector subscriber to be called.
      await Promise.resolve();

      // Not called, because the subscription was unsubscribed.
      expect(listener).toHaveBeenCalledTimes(3);
    });
  });

  describe("createActions", () => {
    it("should increment the count by one", () => {
      store.actions.incrementOne();

      expect(store.value).toEqual({ count: 1 });

      store.actions.incrementOne();

      expect(store.value).toEqual({ count: 2 });
    });

    it("should decrement the count by one", () => {
      store.actions.decrementOne();

      expect(store.value).toEqual({ count: -1 });

      store.actions.decrementOne();

      expect(store.value).toEqual({ count: -2 });
    });
  });

  describe("when not extended", () => {
    type Book = { title: string; author: string };
    type State = { books: readonly Book[] };

    const initialState = {
      books: [
        { title: "Fire and Blood", author: "George R. R. Martin" },
        { title: "The Hobbit", author: "J. R. R. Tolkien" },
      ],
    };

    let bookStore: Store<State>;

    beforeEach(() => {
      // A new store instance can be created without extending the `Store` class.
      // This is useful for testing or when a simple store is needed.
      bookStore = new Store<State>(initialState);
    });

    it("should initialize with the provided initial state", () => {
      expect(bookStore.value).toEqual(initialState);
    });

    it("should allow dispatching actions", () => {
      expect(bookStore.value).toEqual(initialState);

      // Dispatching an action that does not change the state.
      bookStore.dispatch({ type: "UNKNOWN_ACTION" });

      expect(bookStore.value).toEqual(initialState);
    });

    it("should allow creating actions", () => {
      // Create an action that adds a book.
      const addBook = bookStore.createAction<Book>(
        "addBook",
        reduce.createPropTransform("books", reduce.elementAppend),
      );

      addBook({ title: "1984", author: "George Orwell" });

      expect(bookStore.value).toEqual({
        books: [
          ...initialState.books,
          { title: "1984", author: "George Orwell" },
        ],
      });
    });
  });
});
