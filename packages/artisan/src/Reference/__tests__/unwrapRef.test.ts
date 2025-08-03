/// <reference types="bun-types" />
/// <reference lib="dom" />

import { beforeEach, describe, expect, it } from "bun:test";

import { typeCheck } from "../../utils/mod";
import { createReference } from "../createReference";
import type { Reference } from "../types";
import { unwrapRef } from "../unwrapRef";

describe("unwrapRef", () => {
  let originValue: { foo$: Reference<number> };
  let origin: Reference<typeof originValue | undefined>;

  beforeEach(() => {
    originValue = { foo$: createReference(42) };
    origin = createReference<typeof originValue | undefined>(undefined);
  });

  it("should derive a reference with fallback", () => {
    const derived = unwrapRef({
      origin,
      derive: ({ foo$ }) => foo$,
      fallback: 0,
    });

    expect(derived.get()).toBe(0);
  });

  it("should derive a reference without fallback", () => {
    const derived = unwrapRef({
      origin,
      derive: ({ foo$ }) => foo$,
    });

    expect(derived.get()).toBeUndefined();
  });

  describe("when the origin reference updates", () => {
    it("should update the derived reference", async () => {
      const derived = unwrapRef({
        origin,
        derive: ({ foo$ }) => foo$,
      });

      expect(derived.get()).toBeUndefined();

      origin.set(originValue);

      // Doesn't update synchronously
      expect(derived.get()).toBeUndefined();

      // Wait for the origin reference to notify
      await Promise.resolve();
      // Wait for the derived reference to notify
      await Promise.resolve();

      expect(derived.get()).toBe(42);
    });
  });

  describe("when the derived reference updates", () => {
    it("should update the derived reference", async () => {
      const derived = unwrapRef({
        origin,
        derive: ({ foo$ }) => foo$,
      });

      expect(derived.get()).toBeUndefined();

      origin.set(originValue);

      // Wait for the origin reference to notify
      await Promise.resolve();
      // Wait for the derived reference to notify
      await Promise.resolve();

      expect(derived.get()).toBe(42);

      originValue.foo$.set(50);

      // Doesn't update synchronously
      expect(derived.get()).toBe(42);

      // Wait for the derived reference to notify
      await Promise.resolve();

      expect(derived.get()).toBe(50);
    });
  });

  describe("when the origin value is not available", () => {
    it("should update the derived reference to be undefined", async () => {
      const derived = unwrapRef({
        origin,
        derive: ({ foo$ }) => foo$,
      });

      expect(derived.get()).toBeUndefined();

      origin.set(originValue);

      // Wait for the origin reference to notify
      await Promise.resolve();
      // Wait for the derived reference to notify
      await Promise.resolve();

      expect(derived.get()).toBe(42);

      origin.set(undefined);

      // Doesn't update synchronously
      expect(derived.get()).toBe(42);

      // Wait for the origin reference to notify
      await Promise.resolve();

      expect(derived.get()).toBeUndefined();
    });

    describe("when a fallback value is provided", () => {
      it("should update the derived reference to the fallback value", async () => {
        const derived = unwrapRef({
          origin,
          derive: ({ foo$ }) => foo$,
          fallback: 0,
        });

        expect(derived.get()).toBe(0);

        origin.set(originValue);

        // Wait for the origin reference to notify
        await Promise.resolve();
        // Wait for the derived reference to notify
        await Promise.resolve();

        expect(derived.get()).toBe(42);

        origin.set(undefined);

        // Doesn't update synchronously
        expect(derived.get()).toBe(42);

        // Wait for the origin reference to notify
        await Promise.resolve();

        expect(derived.get()).toBe(0);
      });
    });
  });

  describe("when not provided with a derive handler", () => {
    let originValue: { foo$: Reference<number> };
    let origin: Reference<typeof originValue | undefined>;

    beforeEach(() => {
      originValue = { foo$: createReference(42) };
      origin = createReference<typeof originValue | undefined>(undefined);
    });

    it("should unwrap a nested reference one level deep", async () => {
      const str$ = createReference("Hi");
      const nested$ = createReference<Reference<string> | undefined>(undefined);
      const maybeStr$ = unwrapRef(nested$);

      typeCheck<Reference.Unwrapped<string | undefined>>(
        typeCheck.identify(maybeStr$),
      );

      expect(str$.value).toBe("Hi");
      expect(nested$.value).toBeUndefined();
      expect(maybeStr$.value).toBeUndefined();

      nested$.value = str$;

      expect(str$.value).toBe("Hi");
      expect(nested$.value).toBe(str$);
      // The value won't update synchronously
      expect(maybeStr$.value).toBeUndefined();

      // Wait for the `str$` reference to update the `nested$` reference
      await Promise.resolve();
      // Wait for the `nested$` reference to update the `maybeStr$` reference
      await Promise.resolve();

      expect(maybeStr$.value).toBe("Hi");

      str$.value = "Hello";

      // The value for `str$` should update synchronously
      expect(str$.value).toBe("Hello");
      // The nested$ reference doesn't change
      expect(nested$.value).toBe(str$);
      // The value won't update synchronously
      expect(maybeStr$.value).toBe("Hi");

      // Wait for the `str$` reference to update the `maybeStr$` reference
      // Only one microtask is needed, because the `maybeStr$` reference subscribes
      // to both `nested$` and `str$` references for updates.
      await Promise.resolve();

      expect(maybeStr$.value).toBe("Hello");
    });
  });
});
