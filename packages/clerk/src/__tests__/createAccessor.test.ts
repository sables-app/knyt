import { beforeEach, describe, expect, it, mock } from "bun:test";

import { createAccessor } from "../createAccessor";
import { select } from "../select/mod";
import { TodoStore } from "./TodoStore";

describe("createAccessor", () => {
  const firstTodo = { id: 1, text: "Test", completed: false };
  const secondTodo = { id: 2, text: "Another", completed: false };

  let todoStore: TodoStore;
  let accessor: ReturnType<typeof prepAccessor>;

  function prepAccessor() {
    return createAccessor(todoStore, {
      count: (state) => state.todos.length,
      lastTodo: select(todoStore.selectors.todos).combine(select.lastELement),
    });
  }

  beforeEach(() => {
    todoStore = new TodoStore();
    accessor = prepAccessor();

    todoStore.actions.addTodo(firstTodo);
  });

  it("should return correct selected values", () => {
    expect(accessor.count).toBe(1);
    expect(accessor.lastTodo).toBe(firstTodo);
  });

  it("should provide selector functions", () => {
    const state = todoStore.value;

    expect(accessor.selectCount(state)).toBe(1);
    expect(accessor.selectLastTodo(state)).toBe(firstTodo);
  });

  it("should provide observable references", () => {
    expect(accessor.count$.value).toBe(1);
    expect(accessor.lastTodo$.value).toBe(firstTodo);
  });

  it("should update count$ when todos change", async () => {
    const subscriber = mock();
    const subscription = accessor.count$.subscribe(subscriber);

    expect(subscriber).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenLastCalledWith(1);

    todoStore.actions.addTodo(secondTodo);

    await Promise.resolve();
    await Promise.resolve();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenLastCalledWith(2);

    subscription.unsubscribe();
  });

  it("should update lastTodo$ when todos change", async () => {
    const subscriber = mock();
    const subscription = accessor.lastTodo$.subscribe(subscriber);

    expect(subscriber).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenLastCalledWith(firstTodo);

    todoStore.actions.addTodo(secondTodo);

    await Promise.resolve();
    await Promise.resolve();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenLastCalledWith(secondTodo);

    subscription.unsubscribe();
  });
});
