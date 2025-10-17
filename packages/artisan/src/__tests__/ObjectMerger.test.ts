/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { ObjectMerger } from "../ObjectMerger.ts";

describe("ObjectMerger", () => {
  it("should memoize entity collections", () => {
    type Target = {
      entities: readonly { id: string }[] | undefined;
    };

    const merger = new ObjectMerger<Target>();

    const targetA: Target = { entities: [{ id: "a" }] };
    const targetB: Target = { entities: [{ id: "b" }] };

    function mergeTargets(): Target {
      return merger.merge((tools) => {
        return {
          entities: tools.entityCollection(targetA.entities, targetB.entities),
        };
      });
    }

    const resultA = mergeTargets();
    const resultB = mergeTargets();

    expect<Target>(resultA).toEqual({
      entities: [{ id: "a" }, { id: "b" }],
    });

    expect(resultA).toBe(resultB);
  });

  it("should memoize properties", () => {
    type Target = {
      foo: string;
    };

    const merger = new ObjectMerger<Target>();

    const targetA: Target = { foo: "a" };
    const targetB: Target = { foo: "b" };

    function mergeTargets(): Target {
      return merger.merge((tools): Target => {
        return {
          foo: tools.property("foo", targetA, targetB),
        };
      });
    }

    const resultA = mergeTargets();
    const resultB = mergeTargets();

    expect<Target>(resultA).toEqual({ foo: "b" });

    expect(resultA).toBe(resultB);
  });

  it("should memoize callbacks", () => {
    type Target = {
      qux?: (event: Event) => void;
    };

    const merger = new ObjectMerger<Target>();

    const targetA: Target = { qux: mock() };
    const targetB: Target = { qux: mock() };

    function mergeTargets(): Target {
      return merger.merge((tools) => {
        return {
          qux: tools.callback(targetA.qux, targetB.qux),
        };
      });
    }

    const resultA = mergeTargets();
    const resultB = mergeTargets();

    expect(resultA.qux!).toBe(resultB.qux!);

    expect(targetA.qux).not.toHaveBeenCalled();
    expect(targetB.qux).not.toHaveBeenCalled();

    const event = new Event("foo");

    resultA.qux?.(event);

    expect(targetA.qux).toHaveBeenLastCalledWith(event);
    expect(targetB.qux).toHaveBeenLastCalledWith(event);
  });

  it("should memoize multiple calls", () => {
    type Target = {
      foo: string;
      bar?: readonly { id: string; baz: string }[];
      qux?: (event: Event) => void;
    };

    const merger = new ObjectMerger<Target>();

    const targetA: Target = {
      foo: "a",
      bar: [{ id: "a", baz: "a" }],
      qux: mock(),
    };
    const targetB: Target = {
      foo: "b",
      bar: [{ id: "b", baz: "b" }],
      qux: mock(),
    };

    function mergeTargets(): Target {
      return merger.merge((tools) => {
        return {
          foo: tools.property("foo", targetA, targetB),
          bar: tools.entityCollection(targetA.bar, targetB.bar),
          qux: tools.callback(targetA.qux, targetB.qux),
        };
      });
    }

    const resultA = mergeTargets();
    const resultB = mergeTargets();

    expect<Target>(resultA).toEqual({
      foo: "b",
      bar: [
        { id: "a", baz: "a" },
        { id: "b", baz: "b" },
      ],
      qux: expect.any(Function),
    });

    expect(resultA).toBe(resultB);

    expect(targetA.qux).not.toHaveBeenCalled();
    expect(targetB.qux).not.toHaveBeenCalled();

    const event = new Event("foo");

    resultA.qux?.(event);

    expect(targetA.qux).toHaveBeenLastCalledWith(event);
    expect(targetB.qux).toHaveBeenLastCalledWith(event);
  });

  it("should memoize individual properties", () => {
    type Target = {
      foo: string;
      bar?: readonly { id: string; baz: string }[];
      qux?: (event: Event) => void;
    };

    const merger = new ObjectMerger<Target>();

    const targetA: Target = {
      foo: "a",
      bar: [{ id: "a", baz: "a" }],
      qux: mock(),
    };
    const targetB: Target = {
      foo: "b",
      bar: [{ id: "d", baz: "d" }],
      qux: mock(),
    };
    const targetC: Target = {
      foo: "c",
      bar: targetB.bar,
      qux: mock(),
    };

    function mergeTargets(otherTarget: Target): Target {
      return merger.merge((tools) => {
        return {
          foo: tools.property("foo", targetA, otherTarget),
          bar: tools.entityCollection(targetA.bar, otherTarget.bar),
          qux: tools.callback(targetA.qux, otherTarget.qux),
        };
      });
    }

    const resultA = mergeTargets(targetB);
    const resultB = mergeTargets(targetC);

    expect<Target>(resultA).toEqual({
      foo: "b",
      bar: [
        { id: "a", baz: "a" },
        { id: "d", baz: "d" },
      ],
      qux: expect.any(Function),
    });

    expect<Target>(resultB).toEqual({
      foo: "c",
      bar: [
        { id: "a", baz: "a" },
        { id: "d", baz: "d" },
      ],
      qux: expect.any(Function),
    });

    expect(resultA).not.toBe(resultB);
    expect(resultA.foo).not.toBe(resultB.foo);
    expect(resultA.bar).toBe(resultB.bar!);
    expect(resultA.qux).not.toBe(resultB.qux);

    expect(targetA.qux).not.toHaveBeenCalled();
    expect(targetB.qux).not.toHaveBeenCalled();
    expect(targetC.qux).not.toHaveBeenCalled();

    const event = new Event("foo");

    resultA.qux?.(event);

    expect(targetA.qux).toHaveBeenCalledTimes(1);
    expect(targetA.qux).toHaveBeenLastCalledWith(event);
    expect(targetB.qux).toHaveBeenCalledTimes(1);
    expect(targetB.qux).toHaveBeenLastCalledWith(event);
    expect(targetC.qux).not.toHaveBeenCalled();

    const event2 = new Event("foo");

    resultB.qux?.(event2);

    expect(targetA.qux).toHaveBeenCalledTimes(2);
    expect(targetA.qux).toHaveBeenLastCalledWith(event2);
    expect(targetB.qux).toHaveBeenCalledTimes(1);
    expect(targetB.qux).toHaveBeenLastCalledWith(event);
    expect(targetC.qux).toHaveBeenCalledTimes(1);
    expect(targetC.qux).toHaveBeenLastCalledWith(event2);
  });
});
