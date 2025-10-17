/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { getLastDefinedProperty } from "../getLastDefinedProperty.ts";

describe("getLastDefinedProperty", () => {
  it("should return the last defined property", () => {
    const result = getLastDefinedProperty("foo", { foo: "a" }, { foo: "b" });

    expect(result).toBe("b");
  });

  it("should return the last defined property when its set to undefined", () => {
    const result = getLastDefinedProperty(
      "foo",
      { foo: "a" },
      { foo: undefined },
    );

    expect(result).toBeUndefined();
  });

  it("should skip properties that are not defined", () => {
    const result = getLastDefinedProperty<"foo", { foo?: string }>(
      "foo",
      {},
      { foo: "c" },
      {},
    );

    expect(result).toBe("c");
  });
});
