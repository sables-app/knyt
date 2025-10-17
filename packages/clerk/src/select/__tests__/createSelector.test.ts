/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { createSelector } from "../createSelector.ts";

describe("createSelector", () => {
  type StateA = {
    foo: number;
    bar: string;
  };

  type StateB = {
    baz?: boolean;
  };

  const stateA: StateA = { foo: 82, bar: "hello" };
  const stateB: StateB = { baz: true };

  it("should combine selector results using the combiner", () => {
    const selector = createSelector(
      (state: StateA) => state.foo,
      (state: StateA) => state.bar,
    ).combine((foo, bar) => `${bar}-${foo}`);

    expect(selector(stateA)).toBe("hello-82");
  });

  it("should work with selectors from different state types", () => {
    const selector = createSelector(
      (state: StateA) => state.foo,
      (state: StateB) => state.baz,
    ).combine((foo, baz) => `${baz ? "yes" : "no"}-${foo}`);

    expect(selector({ foo: 10, bar: "x" })).toBe("no-10");
    expect(selector({ foo: 10, bar: "x", baz: true })).toBe("yes-10");
  });

  it("should memoize the combiner result", () => {
    const combiner = mock((foo: number, bar: string) => ({
      fooBar: `${bar}-${foo}`,
    }));
    const selector = createSelector(
      (state: StateA) => state.foo,
      (state: StateA) => state.bar,
    ).combine(combiner);

    const resultA = selector(stateA);
    const resultB = selector(stateA);

    expect(resultA).toEqual({ fooBar: "hello-82" });
    expect(resultB).toBe(resultA); // Same object due to memoization

    expect(combiner).toHaveBeenCalledTimes(1);

    // Changing input should call combiner again
    selector({ foo: 43, bar: "hello" });
    expect(combiner).toHaveBeenCalledTimes(2);
  });

  it("should handle empty selectors array", () => {
    const selector = createSelector().combine(() => "empty");

    expect(selector({})).toBe("empty");
  });

  it("should pass correct arguments to the combiner", () => {
    const selector = createSelector(
      (state: StateA) => state.foo,
      (state: StateA) => state.bar,
      (state: StateB) => state.baz,
    ).combine((foo, bar, baz) => [foo, bar, baz]);

    expect(selector({ foo: 1, bar: "b", baz: false } as any)).toEqual([
      1,
      "b",
      false,
    ]);
  });

  it("should respect maxCacheSize", () => {
    const combiner = mock((foo: number, bar: string) => ({
      fooBar: `${bar}-${foo}`,
    }));
    const selector = createSelector(
      (state: StateA) => state.foo,
      (state: StateA) => state.bar,
    ).combine(combiner, 2); // Set maxCacheSize to 2

    // First call, cache miss
    expect(selector({ foo: 1, bar: "a" })).toEqual({ fooBar: "a-1" });
    expect(combiner).toHaveBeenCalledTimes(1);

    // Second call, different args, cache miss
    expect(selector({ foo: 2, bar: "b" })).toEqual({ fooBar: "b-2" });
    expect(combiner).toHaveBeenCalledTimes(2);

    // Third call, different args, cache miss, evicts oldest (1,a)
    expect(selector({ foo: 3, bar: "c" })).toEqual({ fooBar: "c-3" });
    expect(combiner).toHaveBeenCalledTimes(3);

    // Repeating second call, should be a cache hit
    expect(selector({ foo: 2, bar: "b" })).toEqual({ fooBar: "b-2" });
    expect(combiner).toHaveBeenCalledTimes(3); // No new call

    // Repeating first call, should be a cache miss (was evicted)
    expect(selector({ foo: 1, bar: "a" })).toEqual({ fooBar: "a-1" });
    expect(combiner).toHaveBeenCalledTimes(4); // New call
  });
});
