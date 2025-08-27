/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test";

import { createReference } from "../createReference";
import { fallbackRef } from "../fallbackRef";

describe("fallbackRef", () => {
  it("returns the source value when it is not null or undefined", async () => {
    const ref = createReference<number | null>(42);
    const fallback = 99;
    const resultRef = fallbackRef(ref, fallback);

    expect(resultRef.value).toBe(42);

    ref.value = 0;
    await Promise.resolve();

    expect(resultRef.value).toBe(0);
  });

  it("returns the fallback value when the source value is null", async () => {
    const ref = createReference<number | null>(null);
    const fallback = 99;
    const resultRef = fallbackRef(ref, fallback);

    expect(resultRef.value).toBe(99);

    ref.value = 10;
    await Promise.resolve();

    expect(resultRef.value).toBe(10);

    ref.value = null;
    await Promise.resolve();

    expect(resultRef.value).toBe(99);
  });

  it("returns the fallback value when the source value is undefined", async () => {
    const ref = createReference<number | undefined>(undefined);
    const fallback = 77;
    const resultRef = fallbackRef(ref, fallback);

    expect(resultRef.value).toBe(77);

    ref.value = 5;
    await Promise.resolve();

    expect(resultRef.value).toBe(5);

    ref.value = undefined;
    await Promise.resolve();

    expect(resultRef.value).toBe(77);
  });

  it("works with string values", async () => {
    const ref = createReference<string | null>("hello");
    const fallback = "fallback";
    const resultRef = fallbackRef(ref, fallback);

    expect(resultRef.value).toBe("hello");

    ref.value = null;
    await Promise.resolve();

    expect(resultRef.value).toBe("fallback");
  });

  it("does not call fallback if value is falsy but not null/undefined", async () => {
    const ref = createReference<number | null>(0);
    const fallback = 123;
    const resultRef = fallbackRef(ref, fallback);

    expect(resultRef.value).toBe(0);
  });
});
