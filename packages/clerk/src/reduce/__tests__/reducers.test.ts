import { describe, expect, it } from "bun:test";

import type { Action } from "../../types";
import * as reduce from "../reducers";

describe("reducers", () => {
  describe("itemRemove", () => {
    it("removes an item matching the predicate", () => {
      const arr = [1, 2, 3];
      const result = reduce.itemRemove(arr, (x) => x === 2);

      expect(result).toEqual([1, 3]);
    });

    it("returns the original array if no item matches", () => {
      const arr = [1, 2, 3];
      const result = reduce.itemRemove(arr, (x) => x === 4);

      expect(result).toBe(arr);
    });

    it("returns undefined if input array is undefined", () => {
      expect(reduce.itemRemove(undefined, () => true)).toBeUndefined();
    });
  });

  describe("itemAppend", () => {
    it("appends items to the array", () => {
      expect(reduce.itemAppend([1, 2], 3, 4)).toEqual([1, 2, 3, 4]);
    });

    it("returns new array", () => {
      const arr = [1, 2];
      const result = reduce.itemAppend(arr, 3, 4);

      expect(result).not.toBe(arr);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("returns new array if input is undefined", () => {
      expect(reduce.itemAppend(undefined, 1, 2)).toEqual([1, 2]);
    });
  });

  describe("itemPrepend", () => {
    it("prepends items to the array", () => {
      expect(reduce.itemPrepend([3, 4], 1, 2)).toEqual([1, 2, 3, 4]);
    });

    it("returns new array", () => {
      const arr = [3, 4];
      const result = reduce.itemPrepend(arr, 1, 2);

      expect(result).not.toBe(arr);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("returns new array if input is undefined", () => {
      expect(reduce.itemPrepend(undefined, 1, 2)).toEqual([1, 2]);
    });
  });

  describe("withEntityRemove", () => {
    it("removes entity by id", () => {
      const arr = [{ id: 1 }, { id: 2 }];
      const result = reduce.withEntityRemove()(arr, 2);

      expect(result).toEqual([{ id: 1 }]);
    });

    it("returns original array if id not found", () => {
      const arr = [{ id: 1 }];

      expect(reduce.withEntityRemove()(arr, 2)).toBe(arr);
    });
  });

  describe("itemSwap", () => {
    it("swaps two elements", () => {
      expect(reduce.itemSwap([1, 2, 3], 0, 2)).toEqual([3, 2, 1]);
    });

    it("returns original array if indices are the same", () => {
      const arr = [1, 2, 3];

      expect(reduce.itemSwap(arr, 1, 1)).toBe(arr);
    });

    it("returns original array if index out of bounds", () => {
      const arr = [1, 2, 3];

      expect(reduce.itemSwap(arr, 0, 5)).toBe(arr);
    });
  });

  describe("propUpdate", () => {
    it("returns new object with updated property", () => {
      const state = { a: 1, b: 2 };
      const result = reduce.propUpdate(state, "a", 3);

      expect(result).toEqual({ a: 3, b: 2 });

      expect(result).not.toBe(state);
    });

    it("returns original object if property is unchanged", () => {
      const state = { a: 1, b: 2 };

      expect(reduce.propUpdate(state, "a", 1)).toBe(state);
    });
  });

  describe("toProp / withPropSet", () => {
    it("returns a reducer that updates property", () => {
      type State = { a: number };

      const reducer = reduce.toProp<State, "a">("a");
      const state = { a: 1 };
      const action = { type: "foo", payload: 2 };

      expect(reducer(state, action)).toEqual({ a: 2 });
    });

    it("returns original state if property is unchanged", () => {
      type State = { a: number };

      const reducer = reduce.toProp<State, "a">("a");
      const state = { a: 1 };
      const action = { type: "foo", payload: 1 };

      expect(reducer(state, action)).toBe(state);
    });

    it("supports transformValue function", () => {
      type State = { a: number };

      const reducer = reduce.toProp<State, "a", number>(
        "a",
        (current, payload) => current + payload,
      );
      const state = { a: 1 };
      const action = { type: "foo", payload: 2 };

      expect(reducer(state, action)).toEqual({ a: 3 });
    });
  });

  describe("actionHasError", () => {
    it("returns true if action has error property set", () => {
      type State = { a: number };

      const hasError = reduce.actionHasError<State, Error>;

      const state = { a: 1 };

      const error = new Error("fail");
      const action = { type: "foo", payload: error, error: true };

      expect(hasError(state, action)).toBe(true);
    });

    it("returns false if action has no error property", () => {
      type State = { a: number };

      const hasError = reduce.actionHasError<State, Error>;
      const state = { a: 1 };
      const action = { type: "foo", payload: 123 };

      expect(hasError(state, action)).toBe(false);
    });

    it("returns false if error property is false", () => {
      type State = { a: number };

      const hasError = reduce.actionHasError<State, Error>;
      const state = { a: 1 };
      const action = { type: "foo", payload: 123, error: false };

      expect(hasError(state, action)).toBe(false);
    });
  });

  describe("withBranch", () => {
    it("calls trueReducer if predicate matches", () => {
      type State = { a: number };
      type Payload = number;

      const predicate = (
        _state: State,
        action: { payload: Payload | string },
      ): action is Action<Payload> => typeof action.payload === "number";

      const trueReducer = (state: State, action: Action<number>) => ({
        ...state,
        a: action.payload,
      });
      const falseReducer = (state: State, _action: Action<string>) => ({
        ...state,
        a: -1,
      });

      const reducer = reduce.withBranch(predicate, trueReducer, falseReducer);
      const state = { a: 0 };
      const action = { type: "foo", payload: 42 };

      expect(reducer(state, action)).toEqual({ a: 42 });
    });

    it("calls falseReducer if predicate does not match", () => {
      type State = { a: number };
      type Payload = number;

      const predicate = (
        _state: State,
        action: { payload: Payload | string },
      ): action is Action<Payload> => typeof action.payload === "number";
      const trueReducer = (state: State, action: Action<number>) => ({
        ...state,
        a: action.payload,
      });
      const falseReducer = (state: State, _action: Action<string>) => ({
        ...state,
        a: -1,
      });
      const reducer = reduce.withBranch(predicate, trueReducer, falseReducer);
      const state = { a: 0 };
      const action = { type: "foo", payload: "not a number" };

      expect(reducer(state, action)).toEqual({ a: -1 });
    });
  });

  describe("withErrorBranch", () => {
    it("calls errorReducer if action has error", () => {
      type State = { a: number };

      const errorReducer = (state: State, action: { payload: Error }) => ({
        ...state,
        a: -1,
        errorMessage: action.payload.message,
      });

      const reducer = (state: State, action: Action<number>) => ({
        ...state,
        a: action.payload,
      });
      const combined = reduce.withErrorBranch(
        errorReducer as any,
        reducer as any,
      );
      const state = { a: 0 };
      const error = new Error("fail");
      const action = { type: "foo", payload: error, error: true };

      expect(combined(state, action)).toEqual({ a: -1, errorMessage: "fail" });
    });

    it("calls reducer if action has no error", () => {
      type State = { a: number };

      const errorReducer = (state: State, action: { payload: Error }) => ({
        ...state,
        a: -1,
        errorMessage: action.payload.message,
      });

      const reducer = (state: State, action: Action<number>) => ({
        ...state,
        a: action.payload,
      });
      const combined = reduce.withErrorBranch(
        errorReducer as any,
        reducer as any,
      );
      const state = { a: 0 };
      const action = { type: "foo", payload: 123 };

      expect(combined(state, action)).toEqual({ a: 123 });
    });
  });
});
