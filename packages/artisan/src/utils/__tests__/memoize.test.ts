/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { memoizeMany, memoizeOne } from "../memoize";

describe("memoize", () => {
  describe("memoizeOne", () => {
    it("should return the same result for the same argument", () => {
      const fn = mock((x: number) => x * 2);
      const memoized = memoizeOne(fn);

      expect(memoized(2)).toBe(4);
      expect(memoized(2)).toBe(4);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should call the original function for different arguments", () => {
      const fn = mock((x: number) => x * 2);
      const memoized = memoizeOne(fn);

      expect(memoized(2)).toBe(4);
      expect(memoized(3)).toBe(6);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should cache falsy results", () => {
      const fn = mock((x: number) => (x === 0 ? 0 : x));
      const memoized = memoizeOne(fn);

      expect(memoized(0)).toBe(0);
      expect(memoized(0)).toBe(0);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should not share cache between different memoized functions", () => {
      const fn1 = mock((x: number) => x + 1);
      const fn2 = mock((x: number) => x + 2);

      const memoized1 = memoizeOne(fn1);
      const memoized2 = memoizeOne(fn2);

      expect(memoized1(1)).toBe(2);
      expect(memoized2(1)).toBe(3);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("should respect maxCacheSize", () => {
      const fn = mock((x: number) => x * 2);
      const memoized = memoizeOne(fn, 2);

      expect(memoized(1)).toBe(2); // Cache: {1: 2}
      expect(memoized(2)).toBe(4); // Cache: {1: 2, 2: 4}
      expect(memoized(1)).toBe(2); // Cache hit
      expect(memoized(3)).toBe(6); // Cache: {2: 4, 3: 6} (1 evicted)
      expect(memoized(2)).toBe(4); // Cache hit
      expect(memoized(1)).toBe(2); // Cache: {3: 6, 1: 2} (2 evicted)

      expect(fn).toHaveBeenCalledTimes(4); // Only 4 unique calls
    });

    it("should maintain 'this' context", () => {
      const obj = {
        factor: 3,
        fn: mock(function (this: { factor: number }, x: number) {
          return x * this.factor;
        }),
      };
      const memoized = memoizeOne(obj.fn.bind(obj));

      expect(memoized(2)).toBe(6);
      expect(memoized(2)).toBe(6);
      expect(memoized(3)).toBe(9);
      expect(obj.fn).toHaveBeenCalledTimes(2);
    });

    it("should work with no arguments", () => {
      const fn = mock(() => 42);
      const memoized = memoizeOne(fn);

      expect(memoized()).toBe(42);
      expect(memoized()).toBe(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should work with undefined and null arguments", () => {
      const fn = mock((x: any) =>
        x === undefined ? "undefined" : x === null ? "null" : x,
      );
      const memoized = memoizeOne(fn);

      expect(memoized(undefined)).toBe("undefined");
      expect(memoized(undefined)).toBe("undefined");
      expect(memoized(null)).toBe("null");
      expect(memoized(null)).toBe("null");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should work with complex objects as arguments", () => {
      const fn = mock((obj: { a: number; b: number }) => obj.a + obj.b);
      const memoized = memoizeOne(fn);

      const arg1 = { a: 1, b: 2 };
      const arg2 = { a: 1, b: 2 };

      expect(memoized(arg1)).toBe(3);
      expect(memoized(arg1)).toBe(3); // Cache hit
      expect(memoized(arg2)).toBe(3); // Different reference, should call fn again

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("does differentiate between no argument and `undefined`", () => {
      const fn = mock((x?: any) => (x === undefined ? "undefined" : x));
      const memoized = memoizeOne(fn);

      expect(memoized()).toBe("undefined");
      expect(memoized()).toBe("undefined");
      expect(memoized(undefined)).toBe("undefined");
      expect(memoized(undefined)).toBe("undefined");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("memoizeMany", () => {
    it("should return the same result for the same arguments", () => {
      const fn = mock((x: number) => x * 2);
      const memoized = memoizeMany(fn);

      expect(memoized(2)).toBe(4);
      expect(memoized(2)).toBe(4);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should call the original function for different arguments", () => {
      const fn = mock((x: number) => x * 2);
      const memoized = memoizeMany(fn);

      expect(memoized(2)).toBe(4);
      expect(memoized(3)).toBe(6);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should work with multiple arguments", () => {
      const fn = mock((a: number, b: number) => a + b);
      const memoized = memoizeMany(fn);

      expect(memoized(1, 2)).toBe(3);
      expect(memoized(1, 2)).toBe(3);
      expect(memoized(2, 3)).toBe(5);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should cache falsy results", () => {
      const fn = mock((x: number) => (x === 0 ? 0 : x));
      const memoized = memoizeMany(fn);

      expect(memoized(0)).toBe(0);
      expect(memoized(0)).toBe(0);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should not share cache between different memoized functions", () => {
      const fn1 = mock((x: number) => x + 1);
      const fn2 = mock((x: number) => x + 2);

      const memoized1 = memoizeMany(fn1);
      const memoized2 = memoizeMany(fn2);

      expect(memoized1(1)).toBe(2);
      expect(memoized2(1)).toBe(3);
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it("should respect maxCacheSize", () => {
      const fn = mock((x: number) => x * 2);
      const memoized = memoizeMany(fn, 2);

      expect(memoized(1)).toBe(2); // Cache: {1: 2}
      expect(memoized(2)).toBe(4); // Cache: {1: 2, 2: 4}
      expect(memoized(1)).toBe(2); // Cache hit
      expect(memoized(3)).toBe(6); // Cache: {2: 4, 3: 6} (1 evicted)
      expect(memoized(2)).toBe(4); // Cache hit
      expect(memoized(1)).toBe(2); // Cache: {3: 6, 1: 2} (2 evicted)

      expect(fn).toHaveBeenCalledTimes(4); // Only 4 unique calls
    });

    it("should handle reference equality for arguments", () => {
      const fn = mock((obj: { value: number }) => obj.value * 2);
      const memoized = memoizeMany(fn);

      const arg1 = { value: 2 };
      const arg2 = { value: 2 };

      expect(memoized(arg1)).toBe(4);
      expect(memoized(arg1)).toBe(4); // Cache hit
      expect(memoized(arg2)).toBe(4); // Different reference, should call fn again

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should work with no arguments", () => {
      const fn = mock(() => 42);
      const memoized = memoizeMany(fn);

      expect(memoized()).toBe(42);
      expect(memoized()).toBe(42);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should work with undefined and null arguments", () => {
      const fn = mock((x: any) =>
        x === undefined ? "undefined" : x === null ? "null" : x,
      );
      const memoized = memoizeMany(fn);

      expect(memoized(undefined)).toBe("undefined");
      expect(memoized(undefined)).toBe("undefined");
      expect(memoized(null)).toBe("null");
      expect(memoized(null)).toBe("null");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should work with mixed argument types", () => {
      const fn = mock((a: number, b: string, c: boolean) => `${a}-${b}-${c}`);
      const memoized = memoizeMany(fn);

      expect(memoized(1, "test", true)).toBe("1-test-true");
      expect(memoized(1, "test", true)).toBe("1-test-true");
      expect(memoized(2, "test", false)).toBe("2-test-false");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should maintain 'this' context", () => {
      const obj = {
        factor: 3,
        fn: mock(function (this: { factor: number }, x: number) {
          return x * this.factor;
        }),
      };
      const memoized = memoizeMany(obj.fn.bind(obj));

      expect(memoized(2)).toBe(6);
      expect(memoized(2)).toBe(6);
      expect(memoized(3)).toBe(9);
      expect(obj.fn).toHaveBeenCalledTimes(2);
    });

    it("should handle complex objects as arguments", () => {
      const fn = mock((a: Map<string, number>, b: Set<string>) => {
        return Array.from(a.entries()).reduce(
          (result, [key, num]) => (b.has(key) ? num + result : result),
          0,
        );
      });
      const memoized = memoizeMany(fn);

      const map1 = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      const set1 = new Set(["a"]);

      const map2 = new Map([
        ["a", 1],
        ["b", 2],
      ]);
      const set2 = new Set(["a", "b"]);

      expect(memoized(map1, set1)).toBe(1);
      expect(memoized(map1, set1)).toBe(1); // Cache hit
      expect(memoized(map2, set2)).toBe(3); // Different references, should call fn again

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("does differentiate between no arguments and `undefined`", () => {
      const fn = mock((x?: any) => (x === undefined ? "undefined" : x));
      const memoized = memoizeMany(fn);

      expect(memoized()).toBe("undefined");
      expect(memoized()).toBe("undefined");
      expect(memoized(undefined)).toBe("undefined");
      expect(memoized(undefined)).toBe("undefined");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
