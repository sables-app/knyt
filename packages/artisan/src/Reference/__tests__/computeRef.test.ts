/// <reference types="bun-types" />
/// <reference lib="dom" />

import { describe, expect, it, mock } from "bun:test";

import { computeRef } from "../computeRef.ts";
import { createReference } from "../createReference.ts";

describe("computeRef", () => {
  describe("parameters object", () => {
    it("should compute the initial value based on dependencies", () => {
      const dep1 = createReference(1);
      const dep2 = createReference(2);

      const computed = computeRef({
        dependencies: [dep1, dep2],
        compute: (dep1, dep2) => dep1 + dep2,
      });

      expect(computed.value).toBe(3);
    });

    it("should update the computed value when dependencies change", async () => {
      const dep1 = createReference(1);
      const dep2 = createReference(2);

      const computed = computeRef({
        dependencies: [dep1, dep2],
        compute: (dep1, dep2) => dep1 + dep2,
      });

      // Initial value
      expect(computed.value).toBe(3);

      dep1.value = 3;
      dep2.value = 4;

      // Should not update synchronously
      expect(computed.value).toBe(3);

      await Promise.resolve();

      // The value is not yet updated
      // because updates are batched.
      // Another microtask is needed.
      expect(computed.value).toBe(3);

      await Promise.resolve();

      // Updated asynchronously after the second microtask
      expect(computed.value).toBe(7);
    });

    it("should call onUpdate when the computed value changes", async () => {
      const dep1 = createReference(1);
      const dep2 = createReference(2);
      const onUpdate = mock((currentValue, previousValue) => {});

      const computed = computeRef({
        dependencies: [dep1, dep2],
        compute: (dep1, dep2) => dep1 + dep2,
        onUpdate,
      });

      dep1.value = 3;
      dep2.value = 4;

      // Not called onUpdate synchronously
      expect(onUpdate).not.toHaveBeenCalled();

      // The value is set synchronously
      expect(computed.value).toBe(3);

      await Promise.resolve();

      // Called once for the initial value
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate.mock.calls[0][0]).toBe(3);

      // The value didn't change
      expect(computed.value).toBe(3);

      await Promise.resolve();

      // Not called, because updates are batched
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate.mock.calls[0][0]).toBe(3);

      // The value updated synchronously
      expect(computed.value).toBe(7);

      await Promise.resolve();

      // Called again for the new value
      expect(onUpdate).toHaveBeenCalledTimes(2);
      expect(onUpdate.mock.calls[1][0]).toBe(7);

      // The value didn't change
      expect(computed.value).toBe(7);
    });

    it("should not call onUpdate when the computed value does not change", async () => {
      const dep1 = createReference(1);
      const dep2 = createReference(2);
      const onUpdate = mock(
        (currentValue: number, previousValue: number | undefined) => {},
      );
      const compute = mock((dep1: number, dep2: number) => dep1 + dep2);

      const computed = computeRef({
        dependencies: [dep1, dep2],
        compute,
        onUpdate,
      });

      // Called to compute the initial value
      expect(compute).toHaveBeenCalledTimes(1);
      // Not called synchronously
      expect(onUpdate).not.toHaveBeenCalled();

      await Promise.resolve();

      // Not called again until after another microtasks,
      // because updates are batched.
      expect(compute).toHaveBeenCalledTimes(1);
      // Called for the initial value
      expect(onUpdate).toHaveBeenCalledTimes(1);

      await Promise.resolve();

      // Called again to compute the new value
      // due to the batched update
      expect(compute).toHaveBeenCalledTimes(2);
      // Not called again because the value did not change
      expect(onUpdate).toHaveBeenCalledTimes(1);

      dep1.value = 2;
      dep2.value = 1;

      // Not called, because all computes after the initial value are asynchronous
      expect(compute).toHaveBeenCalledTimes(2);
      // Not called synchronously
      expect(onUpdate).toHaveBeenCalledTimes(1);

      await Promise.resolve();

      // Not called again until after another microtasks,
      // because updates are batched.
      expect(compute).toHaveBeenCalledTimes(2);
      // Not called again until after another microtasks,
      // because updates are batched.
      expect(onUpdate).toHaveBeenCalledTimes(1);

      await Promise.resolve();

      // Called again to compute the new value
      expect(compute).toHaveBeenCalledTimes(3);
      // Not called again because the value did not change
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    it("should unsubscribe from dependencies when unsubscribe is called", () => {
      const dep1 = createReference(1);
      const dep2 = createReference(2);

      const computed = computeRef({
        dependencies: [dep1, dep2],
        compute: (dep1, dep2) => dep1 + dep2,
      });

      computed.subscription.unsubscribe();

      dep1.value = 3;
      dep2.value = 4;

      expect(computed.value).toBe(3); // Should not update after unsubscribe
    });
  });

  describe("dependency arguments", () => {
    it("should compute the initial value based on dependencies", () => {
      const dep1 = createReference(1);
      const dep2 = createReference("2px");

      const computed = computeRef(dep1, dep2, (dep1, dep2) => {
        expect<number>(dep1);
        expect<string>(dep2);

        return dep1 + parseInt(dep2, 10);
      });

      expect<number>(computed.value).toBe(3);
    });

    it("should handle 10 dependencies with accurate types", () => {
      const computed = computeRef(
        createReference(1),
        createReference("2px"),
        createReference(3),
        createReference("4px"),
        createReference(5),
        createReference("6px"),
        createReference(7),
        createReference("8px"),
        createReference(9),
        createReference(new Date(10)),
        (dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8, dep9, dep10) => {
          expect<number>(dep1);
          expect<string>(dep2);
          expect<number>(dep3);
          expect<string>(dep4);
          expect<number>(dep5);
          expect<string>(dep6);
          expect<number>(dep7);
          expect<string>(dep8);
          expect<number>(dep9);
          expect<Date>(dep10);

          const deps = [
            dep1,
            dep2,
            dep3,
            dep4,
            dep5,
            dep6,
            dep7,
            dep8,
            dep9,
            dep10,
          ];

          return deps.reduce<number>((sum, dep) => {
            if (typeof dep === "number") {
              return sum + dep;
            }
            if (typeof dep === "string") {
              return sum + parseInt(dep, 10);
            }
            if (dep instanceof Date) {
              return sum + dep.valueOf();
            }

            throw new Error("Unexpected dependency type");
          }, 0);
        },
      );

      expect<number>(computed.value).toBe(55);
    });

    it("should have the correct types for the `onUpdate` callback", () => {
      computeRef({
        dependencies: [createReference(1), createReference("2px")],
        compute: (dep1, dep2) => dep1 + parseInt(dep2, 10),
        onUpdate(computedValue) {
          expect<number>(computedValue);
        },
      });
    });
  });
});
