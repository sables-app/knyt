import { computeRef, ref } from "@knyt/artisan";
import { beforeEach, describe, expect, it, mock, test } from "bun:test";

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
      lastTodo: select(todoStore.select.todos).combine(select.last),
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

  describe("$values", () => {
    describe("returned object", () => {
      it("should be enumerable", () => {
        expect(Object.keys(accessor.$values())).toEqual(["count", "lastTodo"]);
      });

      it("should be able to be cloned with spread operator", () => {
        expect(accessor.$values().count).toBe(1);
        expect(accessor.$values().lastTodo).toBe(firstTodo);

        const cloned = { ...accessor.$values() };

        expect(cloned).toEqual({ count: 1, lastTodo: firstTodo });
      });
    });

    it("should return a new object each time", () => {
      expect(accessor.$values()).not.toBe(accessor.$values());
    });
  });

  test("demo", async () => {
    const collectionA = ref([1, 2, 3, 4, 5]);
    const collectionB = ref([6, 7, 8, 9, 10]);
    const combinedCollection = computeRef(collectionA, collectionB, (a, b) => [
      ...a,
      ...b,
    ]);
    const accessor = createAccessor(combinedCollection, {
      count: select.count,
      max: select.max<number>,
      min: select.min<number>,
      evenNumbers: select.withFilter((num) => num % 2 === 0),
    });

    expect(accessor.count).toBe(10);
    expect(accessor.max).toBe(10);
    expect(accessor.min).toBe(1);
    expect(accessor.evenNumbers).toEqual([2, 4, 6, 8, 10]);

    collectionA.value = [20, 30];
    collectionB.value = [40, 50];

    // Wait exactly two microtasks for the updates to propagate
    await Promise.resolve();
    await Promise.resolve();

    expect(accessor.count).toBe(4);
    expect(accessor.max).toBe(50);
    expect(accessor.min).toBe(20);
    expect(accessor.evenNumbers).toEqual([20, 30, 40, 50]);
  });
});
