/// <reference types="bun-types" />
/// <reference lib="dom" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import { chain } from "../../utils/mod";
import { createReference } from "../createReference";
import { mapRef } from "../mapRef";
import type { Reference } from "../types";

describe("mapRef", () => {
  let dependencyValue: { foo: number };
  let origin: Reference<typeof dependencyValue>;

  beforeEach(() => {
    dependencyValue = { foo: 42 };
    origin = createReference<typeof dependencyValue>(dependencyValue);
  });

  it("should transform a reference", () => {
    const transformed = mapRef<number, typeof dependencyValue>({
      origin,
      transform: ({ foo }) => foo,
    });

    expect(transformed.get()).toBe(42);
  });

  it("should accept multiple arguments", () => {
    const transformed = mapRef(origin, ({ foo }) => foo);

    expect(transformed.get()).toBe(42);
  });

  describe("when the origin reference updates", () => {
    it("should update the transformed reference", async () => {
      const transformed = mapRef({
        origin,
        transform: ({ foo }) => foo,
      });

      expect(transformed.get()).toBe(42);

      origin.set({ foo: 50 });

      // Doesn't update synchronously
      expect(transformed.get()).toBe(42);

      await Promise.resolve();

      expect(transformed.get()).toBe(50);
    });

    it("should call onUpdate with the new value", async () => {
      const onUpdate = mock(
        (currentValue: number, previousValue: number | undefined) => {},
      );
      const transformed = mapRef({
        origin,
        transform: ({ foo }) => foo,
        onUpdate,
      });

      // Not called synchronously
      expect(onUpdate).not.toHaveBeenCalled();

      await Promise.resolve();

      // Called for the initial value
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate).lastCalledWith(42, undefined);

      origin.set({ foo: 50 });

      // Not called synchronously
      expect(onUpdate).toHaveBeenCalledTimes(1);

      // Wait for origin to update
      await Promise.resolve();
      // Wait for transformed reference to update
      await Promise.resolve();

      expect(onUpdate).toHaveBeenCalledTimes(2);
      expect(onUpdate).toHaveBeenCalledWith(50, 42);
    });

    it("should call observers with the new value", async () => {
      const observer = { next: mock() };
      const transformed = mapRef({
        origin,
        transform: ({ foo }) => foo,
      });

      transformed.subscribe(observer);

      // Not called synchronously
      expect(observer.next).not.toHaveBeenCalled();

      // Wait for initial value to be propagated
      await Promise.resolve();

      // Called for the initial values from the origin,
      // and again for when the subscription is created
      expect(observer.next).toHaveBeenCalledTimes(2);
      expect(observer.next).lastCalledWith(42);

      origin.set({ foo: 50 });

      // Not called synchronously
      expect(observer.next).toHaveBeenCalledTimes(2);

      // Wait for origin to update
      await Promise.resolve();
      // Wait for transformed reference to update
      await Promise.resolve();

      expect(observer.next).toHaveBeenCalledTimes(3);
      expect(observer.next).toHaveBeenCalledWith(50);
    });
  });

  describe("when used with chain", () => {
    it("should allow chaining transformations", () => {
      const transformed = chain(origin)
        .map(mapRef(({ foo }) => foo * 2))
        .get();

      expect(transformed.value).toBe(84);
    });
  });
});
