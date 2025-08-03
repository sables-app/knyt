/// <reference types="bun-types" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import { TodoStore, type Todo, type TodoState } from "./TodoStore";

describe("TodoStore", () => {
  let store: TodoStore;

  const sampleTodo: Todo = {
    id: 1,
    text: "Test Todo",
    completed: false,
  };

  beforeEach(() => {
    store = new TodoStore();
  });

  it("should initialize with empty todos", () => {
    expect(store.todos).toEqual([]);
  });

  it("should add a todo", () => {
    expect(store.todos).toEqual([]);

    store.actions.addTodo(sampleTodo);

    expect(store.todos).toEqual([sampleTodo]);
  });

  it("should get a todo by id", () => {
    expect(store.getTodoById(sampleTodo.id)).toBeUndefined();

    store.actions.addTodo(sampleTodo);

    const todo = store.getTodoById(sampleTodo.id);

    expect(todo).toEqual(sampleTodo);
  });

  it("should toggle a todo's completed state", () => {
    expect(store.latestTodo).toBeUndefined();
    store.actions.addTodo(sampleTodo);

    expect(store.latestTodo).toEqual(sampleTodo);
    expect(store.latestTodo?.completed).toBe(false);

    store.actions.toggleTodo(sampleTodo.id);

    expect(store.latestTodo?.completed).toBe(true);

    store.actions.toggleTodo(sampleTodo.id);

    expect(store.latestTodo?.completed).toBe(false);
  });

  it("should remove a todo", () => {
    store.actions.addTodo(sampleTodo);

    expect(store.todos).toEqual([sampleTodo]);

    store.actions.removeTodo(sampleTodo.id);

    expect(store.todos).toEqual([]);
  });

  it("should set latestError on error in addTodo", () => {
    expect(store.get().latestError).toBeUndefined();

    const error = new Error("Test Error");

    store.actions.addTodo(error);

    expect(store.get().latestError).toBe(error);
  });

  it("should not add a todo if an error is dispatched", () => {
    expect(store.get().todos).toEqual([]);

    store.actions.addTodo(new Error("Test Error"));

    expect(store.get().todos).toEqual([]);
  });

  it("should clear latestError", () => {
    store.actions.addTodo(new Error("Test Error"));

    expect(store.get().latestError).toBeInstanceOf(Error);

    store.actions.clearError();

    expect(store.get().latestError).toBeUndefined();
  });

  it("errors$ observable emits latestError", async () => {
    const errors: (Error | undefined)[] = [];
    const subscriber = mock((err) => errors.push(err));
    const subscription = store.errors$.subscribe(subscriber);

    // The observable doesn't update synchronously
    expect(errors).toHaveLength(0);

    // Wait for initial value to be emitted
    await Promise.resolve();

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenLastCalledWith(undefined);

    const error = new Error("Test Error");

    store.actions.addTodo(error);

    // Wait for store to emit an update
    await Promise.resolve();
    // Wait for the errors$ to emit the error
    await Promise.resolve();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenLastCalledWith(error);

    store.actions.clearError();

    // Wait for store to emit an update
    await Promise.resolve();
    // Wait for the errors$ to emit the error
    await Promise.resolve();

    expect(subscriber).toHaveBeenCalledTimes(3);
    expect(subscriber).toHaveBeenLastCalledWith(undefined);

    subscription.unsubscribe();
  });
});
