/// <reference types="bun-types" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import { BasicReference } from "../BasicReference.ts";

describe("BasicReference", () => {
  let reference: BasicReference<number>;

  beforeEach(() => {
    reference = new BasicReference({
      initialValue: 0,
      onUpdate: mock(),
      comparator: (a, b) => a === b,
    });
  });

  it("should initialize with the given initial value", () => {
    expect(reference.value).toBe(0);
  });

  it("should update the value when set is called", () => {
    reference.set(10);

    expect(reference.value).toBe(10);
  });

  it("should not notify subscribers if the value does not change", async () => {
    const subscriber = mock();

    reference.subscribe(subscriber);
    reference.set(0);

    // Not called synchronously
    expect(subscriber).not.toHaveBeenCalled();

    await Promise.resolve();

    // Only called once for the initial value
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("should notify subscribers when the value changes", async () => {
    const subscriber = mock();

    reference.subscribe(subscriber);
    reference.set(10);

    // Not called synchronously
    expect(subscriber).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(subscriber).toHaveBeenCalledWith(10);
  });

  it("should call the onUpdate handler when the value changes", async () => {
    const onUpdate = mock();

    reference = new BasicReference({
      initialValue: 0,
      onUpdate,
    });

    await Promise.resolve();

    expect(onUpdate).lastCalledWith(0, undefined);

    reference.set(10);

    await Promise.resolve();

    expect(onUpdate).lastCalledWith(10, 0);
  });

  describe("asReadonly", () => {
    it("should return a readonly reference with asReadonly", () => {
      const readonlyRef = reference.asReadonly();

      expect(readonlyRef.value).toBe(0);

      expect(() => {
        // @ts-expect-error: readonly reference should not allow set
        readonlyRef.set(10);
      }).toThrow();
    });
  });
  describe("when given a custom comparator that blocks changes", () => {
    it("should still set the value", () => {
      const customComparator = mock((a, b) => Math.abs(a - b) < 5);
      reference = new BasicReference({
        initialValue: 0,
        comparator: customComparator,
      });
      reference.set(3);

      expect(reference.value).toBe(3);
      expect(customComparator).toHaveBeenCalledWith(0, 3);
    });

    it("should not emit a change notification", async () => {
      const customComparator = mock((a, b) => Math.abs(a - b) < 5);
      const subscriber = mock();
      reference = new BasicReference({
        initialValue: 0,
        comparator: customComparator,
      });

      // Wait for the initial value to be emitted
      await Promise.resolve();

      reference.subscribe(subscriber);

      // Not called synchronously
      expect(subscriber).not.toHaveBeenCalled();

      await Promise.resolve();

      // Called upon subscription with the current value
      expect(subscriber).lastCalledWith(0);
      expect(subscriber).toHaveBeenCalledTimes(1);

      reference.set(3);

      expect(reference.value).toBe(3);
      expect(customComparator).toHaveBeenCalledWith(0, 3);

      await Promise.resolve();

      // Still not called, as the comparator blocked the change
      expect(subscriber).toHaveBeenCalledTimes(1);

      reference.set(8);

      expect(reference.value).toBe(8);
      expect(customComparator).toHaveBeenCalledWith(3, 8);

      await Promise.resolve();

      // Now called with the new value, because the comparator allows it
      expect(subscriber).lastCalledWith(8);
      expect(subscriber).toHaveBeenCalledTimes(2);
    });
  });

  it("should notify new subscribers with the current value", async () => {
    const subscriber = mock();
    reference.subscribe(subscriber);

    await Promise.resolve();

    expect(subscriber).toHaveBeenCalledWith(0);
  });

  describe("value property", () => {
    it("can be incremented", () => {
      expect(reference.value).toBe(0);

      reference.value += 1;

      expect(reference.value).toBe(1);

      reference.value++;

      expect(reference.value).toBe(2);

      reference.value += 3;

      expect(reference.value).toBe(5);

      ++reference.value;

      expect(reference.value).toBe(6);
    });
  });
});
