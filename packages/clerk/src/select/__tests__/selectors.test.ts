/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test";

import * as selectors from "../selectors.ts";

describe("selectors", () => {
  describe("last", () => {
    it("returns the last element of an array", () => {
      expect(selectors.last([1, 2, 3])).toBe(3);
      expect(selectors.last(["a", "b", "c"])).toBe("c");
    });

    it("returns undefined for an empty array", () => {
      expect(selectors.last([])).toBeUndefined();
    });
  });

  describe("first", () => {
    it("returns the first element of an array", () => {
      expect(selectors.first([1, 2, 3])).toBe(1);
      expect(selectors.first(["a", "b", "c"])).toBe("a");
    });

    it("returns undefined for an empty array", () => {
      expect(selectors.first([])).toBeUndefined();
    });
  });

  describe("property", () => {
    it("returns a function that retrieves a property from an object", () => {
      const getName = selectors.property<{ name: string }, "name">("name");

      expect(getName({ name: "Alice" })).toBe("Alice");
    });
  });

  describe("count", () => {
    it("returns the length of an array", () => {
      expect(selectors.count([1, 2, 3])).toBe(3);
    });

    it("returns the size of a Set", () => {
      expect(selectors.count(new Set([1, 2, 3]))).toBe(3);
    });

    it("returns the size of a Map", () => {
      expect(
        selectors.count(
          new Map([
            ["a", 1],
            ["b", 2],
          ]),
        ),
      ).toBe(2);
    });
  });

  describe("max", () => {
    it("returns the largest element in an array", () => {
      expect(selectors.max([1, 3, 2])).toBe(3);
      expect(selectors.max([-5, -1, -10])).toBe(-1);
    });

    it("returns undefined for an empty array", () => {
      expect(selectors.max([])).toBeUndefined();
    });
  });

  describe("min", () => {
    it("returns the smallest element in an array", () => {
      expect(selectors.min([1, 3, 2])).toBe(1);
      expect(selectors.min([-5, -1, -10])).toBe(-10);
    });

    it("returns undefined for an empty array", () => {
      expect(selectors.min([])).toBeUndefined();
    });
  });

  describe("withMaxBy", () => {
    it("returns the element with the largest property value", () => {
      const arr = [{ v: 1 }, { v: 5 }, { v: 3 }];

      expect(selectors.withMaxBy("v")(arr)).toEqual({ v: 5 });
    });

    it("returns undefined for an empty array", () => {
      expect(selectors.withMaxBy("v")([])).toBeUndefined();
    });
  });

  describe("withMinBy", () => {
    it("returns the element with the smallest property value", () => {
      const arr = [{ v: 1 }, { v: 5 }, { v: 3 }];

      expect(selectors.withMinBy("v")(arr)).toEqual({ v: 1 });
    });

    it("returns undefined for an empty array", () => {
      expect(selectors.withMinBy("v")([])).toBeUndefined();
    });
  });

  describe("withFilter", () => {
    it("filters an array based on a predicate", () => {
      const arr = [1, 2, 3, 4];
      const even = selectors.withFilter<number>((x) => x % 2 === 0);

      expect(even(arr)).toEqual([2, 4]);
    });

    it("returns an empty array if no elements match", () => {
      const arr = [1, 3, 5];
      const even = selectors.withFilter<number>((x) => x % 2 === 0);

      expect(even(arr)).toEqual([]);
    });
  });
});
