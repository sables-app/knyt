import { describe, expect, it } from "bun:test";

import type { Action } from "../../types";
import {
  actionHasError,
  createBranch,
  createErrorBranch,
  createPropReplace,
  createPropTransform,
  elementAppend,
  elementPrepend,
  elementRemove,
  elementSwap,
  entityRemove,
  propUpdate,
} from "../reduce";

describe("reducers", () => {
  describe("elementRemove", () => {
    it("removes an item matching the predicate", () => {
      const arr = [1, 2, 3];
      const result = elementRemove(arr, (x) => x === 2);

      expect(result).toEqual([1, 3]);
    });

    it("returns the original array if no item matches", () => {
      const arr = [1, 2, 3];
      const result = elementRemove(arr, (x) => x === 4);

      expect(result).toBe(arr);
    });

    it("returns undefined if input array is undefined", () => {
      expect(elementRemove(undefined, () => true)).toBeUndefined();
    });
  });

  describe("elementAppend", () => {
    it("appends items to the array", () => {
      expect(elementAppend([1, 2], 3, 4)).toEqual([1, 2, 3, 4]);
    });

    it("returns new array", () => {
      const arr = [1, 2];
      const result = elementAppend(arr, 3, 4);

      expect(result).not.toBe(arr);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("returns new array if input is undefined", () => {
      expect(elementAppend(undefined, 1, 2)).toEqual([1, 2]);
    });
  });

  describe("elementPrepend", () => {
    it("prepends items to the array", () => {
      expect(elementPrepend([3, 4], 1, 2)).toEqual([1, 2, 3, 4]);
    });

    it("returns new array", () => {
      const arr = [3, 4];
      const result = elementPrepend(arr, 1, 2);

      expect(result).not.toBe(arr);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("returns new array if input is undefined", () => {
      expect(elementPrepend(undefined, 1, 2)).toEqual([1, 2]);
    });
  });

  describe("entityRemove", () => {
    it("removes entity by id", () => {
      const arr = [{ id: 1 }, { id: 2 }];
      const result = entityRemove(arr, (e) => e.id, 2);

      expect(result).toEqual([{ id: 1 }]);
    });

    it("returns original array if id not found", () => {
      const arr = [{ id: 1 }];

      expect(entityRemove(arr, (e) => e.id, 2)).toBe(arr);
    });
  });

  describe("elementSwap", () => {
    it("swaps two elements", () => {
      expect(elementSwap([1, 2, 3], 0, 2)).toEqual([3, 2, 1]);
    });

    it("returns original array if indices are the same", () => {
      const arr = [1, 2, 3];

      expect(elementSwap(arr, 1, 1)).toBe(arr);
    });

    it("returns original array if index out of bounds", () => {
      const arr = [1, 2, 3];

      expect(elementSwap(arr, 0, 5)).toBe(arr);
    });
  });

  describe("propUpdate", () => {
    it("returns new object with updated property", () => {
      const state = { a: 1, b: 2 };
      const result = propUpdate(state, "a", 3);

      expect(result).toEqual({ a: 3, b: 2 });

      expect(result).not.toBe(state);
    });

    it("returns original object if property is unchanged", () => {
      const state = { a: 1, b: 2 };

      expect(propUpdate(state, "a", 1)).toBe(state);
    });
  });

  describe("createPropTransform", () => {
    it("returns a reducer that updates property", () => {
      type State = { a: number };

      const reducer = createPropTransform<State>("a");
      const state = { a: 1 };
      const action = { type: "foo", payload: 2 };

      expect(reducer(state, action)).toEqual({ a: 2 });
    });

    it("returns original state if property is unchanged", () => {
      type State = { a: number };

      const reducer = createPropTransform<State>("a");
      const state = { a: 1 };
      const action = { type: "foo", payload: 1 };

      expect(reducer(state, action)).toBe(state);
    });

    it("supports transformValue function", () => {
      type State = { a: number };

      const reducer = createPropTransform<State, "a", number>(
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

      const hasError = actionHasError<State, Error>;

      const state = { a: 1 };

      const error = new Error("fail");
      const action = { type: "foo", payload: error, error: true };

      expect(hasError(state, action)).toBe(true);
    });

    it("returns false if action has no error property", () => {
      type State = { a: number };

      const hasError = actionHasError<State, Error>;
      const state = { a: 1 };
      const action = { type: "foo", payload: 123 };

      expect(hasError(state, action)).toBe(false);
    });

    it("returns false if error property is false", () => {
      type State = { a: number };

      const hasError = actionHasError<State, Error>;
      const state = { a: 1 };
      const action = { type: "foo", payload: 123, error: false };

      expect(hasError(state, action)).toBe(false);
    });
  });

  describe("createBranch", () => {
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

      const reducer = createBranch(predicate, trueReducer, falseReducer);
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
      const reducer = createBranch(predicate, trueReducer, falseReducer);
      const state = { a: 0 };
      const action = { type: "foo", payload: "not a number" };

      expect(reducer(state, action)).toEqual({ a: -1 });
    });
  });

  describe("createErrorBranch", () => {
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
      const combined = createErrorBranch(errorReducer as any, reducer as any);
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
      const combined = createErrorBranch(errorReducer as any, reducer as any);
      const state = { a: 0 };
      const action = { type: "foo", payload: 123 };

      expect(combined(state, action)).toEqual({ a: 123 });
    });
  });

  describe("createPropReplace", () => {
    it("returns a reducer that sets a property to a value", () => {
      type State = { a: number };

      const reducer = createPropReplace<State, "a">("a", () => 1);
      const state = { a: 0 };
      const action = { type: "foo", payload: undefined };

      expect(reducer(state, action)).toEqual({ a: 1 });
    });

    it("returns original state if value is unchanged", () => {
      type State = { a: number };

      const reducer = createPropReplace<State, "a">("a", () => 1);
      const state = { a: 1 };
      const action = { type: "foo", payload: undefined };

      expect(reducer(state, action)).toBe(state);
    });
  });
});
