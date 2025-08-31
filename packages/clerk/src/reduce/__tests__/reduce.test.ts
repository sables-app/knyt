import { describe, expect, it } from "bun:test";

import type { Action } from "../../types";
import {
  actionHasError,
  appendElement,
  branch,
  onError,
  prependElement,
  removeElement,
  removeEntityElement,
  swapElements,
  toProperty,
  toPropertyValue,
  updateProperty,
} from "../reduce";

describe("reducers", () => {
  describe("removeElement", () => {
    it("removes an item matching the predicate", () => {
      const arr = [1, 2, 3];
      const result = removeElement(arr, (x) => x === 2);

      expect(result).toEqual([1, 3]);
    });

    it("returns the original array if no item matches", () => {
      const arr = [1, 2, 3];
      const result = removeElement(arr, (x) => x === 4);

      expect(result).toBe(arr);
    });

    it("returns undefined if input array is undefined", () => {
      expect(removeElement(undefined, () => true)).toBeUndefined();
    });
  });

  describe("appendElement", () => {
    it("appends items to the array", () => {
      expect(appendElement([1, 2], 3, 4)).toEqual([1, 2, 3, 4]);
    });

    it("returns new array", () => {
      const arr = [1, 2];
      const result = appendElement(arr, 3, 4);

      expect(result).not.toBe(arr);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("returns new array if input is undefined", () => {
      expect(appendElement(undefined, 1, 2)).toEqual([1, 2]);
    });
  });

  describe("prependElement", () => {
    it("prepends items to the array", () => {
      expect(prependElement([3, 4], 1, 2)).toEqual([1, 2, 3, 4]);
    });

    it("returns new array", () => {
      const arr = [3, 4];
      const result = prependElement(arr, 1, 2);

      expect(result).not.toBe(arr);
      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("returns new array if input is undefined", () => {
      expect(prependElement(undefined, 1, 2)).toEqual([1, 2]);
    });
  });

  describe("removeEntityElement", () => {
    it("removes entity by id", () => {
      const arr = [{ id: 1 }, { id: 2 }];
      const result = removeEntityElement(arr, (e) => e.id, 2);

      expect(result).toEqual([{ id: 1 }]);
    });

    it("returns original array if id not found", () => {
      const arr = [{ id: 1 }];

      expect(removeEntityElement(arr, (e) => e.id, 2)).toBe(arr);
    });
  });

  describe("swapElements", () => {
    it("swaps two elements", () => {
      expect(swapElements([1, 2, 3], 0, 2)).toEqual([3, 2, 1]);
    });

    it("returns original array if indices are the same", () => {
      const arr = [1, 2, 3];

      expect(swapElements(arr, 1, 1)).toBe(arr);
    });

    it("returns original array if index out of bounds", () => {
      const arr = [1, 2, 3];

      expect(swapElements(arr, 0, 5)).toBe(arr);
    });
  });

  describe("updateProperty", () => {
    it("returns new object with updated property", () => {
      const state = { a: 1, b: 2 };
      const result = updateProperty(state, "a", 3);

      expect(result).toEqual({ a: 3, b: 2 });

      expect(result).not.toBe(state);
    });

    it("returns original object if property is unchanged", () => {
      const state = { a: 1, b: 2 };

      expect(updateProperty(state, "a", 1)).toBe(state);
    });
  });

  describe("toProperty", () => {
    it("returns a reducer that updates property", () => {
      type State = { a: number };

      const reducer = toProperty<State>("a");
      const state = { a: 1 };
      const action = { type: "foo", payload: 2 };

      expect(reducer(state, action)).toEqual({ a: 2 });
    });

    it("returns original state if property is unchanged", () => {
      type State = { a: number };

      const reducer = toProperty<State>("a");
      const state = { a: 1 };
      const action = { type: "foo", payload: 1 };

      expect(reducer(state, action)).toBe(state);
    });

    it("supports transformValue function", () => {
      type State = { a: number };

      const reducer = toProperty<State, "a", number>(
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

      const hasError = actionHasError<State, Error>();

      const state = { a: 1 };

      const error = new Error("fail");
      const action = { type: "foo", payload: error, error: true };

      expect(hasError(state, action)).toBe(true);
    });

    it("returns false if action has no error property", () => {
      type State = { a: number };

      const hasError = actionHasError<State, Error>();
      const state = { a: 1 };
      const action = { type: "foo", payload: 123 };

      expect(hasError(state, action)).toBe(false);
    });

    it("returns false if error property is false", () => {
      type State = { a: number };

      const hasError = actionHasError<State, Error>();
      const state = { a: 1 };
      const action = { type: "foo", payload: 123, error: false };

      expect(hasError(state, action)).toBe(false);
    });
  });

  describe("branch", () => {
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

      const reducer = branch(predicate, trueReducer, falseReducer);
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
      const reducer = branch(predicate, trueReducer, falseReducer);
      const state = { a: 0 };
      const action = { type: "foo", payload: "not a number" };

      expect(reducer(state, action)).toEqual({ a: -1 });
    });
  });

  describe("onError", () => {
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
      const combined = onError(errorReducer as any, reducer as any);
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
      const combined = onError(errorReducer as any, reducer as any);
      const state = { a: 0 };
      const action = { type: "foo", payload: 123 };

      expect(combined(state, action)).toEqual({ a: 123 });
    });
  });

  describe("toPropertyValue", () => {
    it("returns a reducer that sets a property to a value", () => {
      type State = { a: number };

      const reducer = toPropertyValue<State, "a">("a", () => 1);
      const state = { a: 0 };
      const action = { type: "foo", payload: undefined };

      expect(reducer(state, action)).toEqual({ a: 1 });
    });

    it("returns original state if value is unchanged", () => {
      type State = { a: number };

      const reducer = toPropertyValue<State, "a">("a", () => 1);
      const state = { a: 1 };
      const action = { type: "foo", payload: undefined };

      expect(reducer(state, action)).toBe(state);
    });
  });
});
