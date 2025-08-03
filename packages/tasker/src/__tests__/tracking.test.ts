/// <reference types="bun-types" />
/// <reference lib="dom" />

import { ref } from "@knyt/artisan";
import { beforeEach, describe, expect, it, mock, type Mock } from "bun:test";

import type { ReactiveControllerHost } from "../ReactiveController";
import { ReactiveControllerHostAdapter } from "../ReactiveControllerHostAdapter";
import { track, untrack } from "../tracking";

describe("tracking", () => {
  let host: ReactiveControllerHost;

  let performUpdate: Mock<any>;

  beforeEach(() => {
    performUpdate = mock();
    host = new ReactiveControllerHostAdapter({ performUpdate });
  });

  describe("track", () => {
    it("should subscribe host to observable and trigger performUpdate on value change", async () => {
      const observable = ref(42);

      // Wait a microtask for the initial emission
      await Promise.resolve();

      track(host, observable);

      // Wait for the observable to emit after subscribing
      await Promise.resolve();

      // Should be called once after initial subscription
      expect(performUpdate).toHaveBeenCalledTimes(1);
      // No arguments should be passed to performUpdate
      expect(performUpdate).lastCalledWith();

      observable.value = 2;

      // Wait for async emission
      await Promise.resolve();

      // Should be called again after value change
      expect(performUpdate).toHaveBeenCalledTimes(2);
    });

    it("should return the observable when tracking", () => {
      const observable = ref(42);
      const result = track(host, observable);

      expect(result).toBe(observable);
    });

    it("should support currying", async () => {
      const observable = ref("foo");
      const curried = track(host);
      const result = curried(observable);

      expect(result).toBe(observable);

      // Wait a microtask for the initial emission
      await Promise.resolve();

      // Called twice; once for the initial value emission,
      // and once for the emission upon subscription.
      expect(performUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe("untrack", () => {
    it("should not trigger performUpdate after untrack", async () => {
      const observable = ref(10);

      track(host, observable);

      // Wait a microtask for the initial emissions
      await Promise.resolve();

      // Called twice; once for the initial value emission,
      // and once for the emission upon subscription.
      expect(performUpdate).toHaveBeenCalledTimes(2);

      untrack(host, observable);

      observable.value = 20;

      // Wait for async emission
      await Promise.resolve();

      expect(performUpdate).toHaveBeenCalledTimes(2);
    });

    it("should return the observable when removing tracking", () => {
      const observable = ref(42);
      const result = untrack(host, observable);

      expect(result).toBe(observable);
    });

    it("should support currying for untrack", async () => {
      const observable = ref(10);

      track(host, observable);

      // Wait a microtask for the initial emissions
      await Promise.resolve();

      // Called twice; once for the initial value emission,
      // and once for the emission upon subscription.
      expect(performUpdate).toHaveBeenCalledTimes(2);

      const curried = untrack(host);
      const result = curried(observable);

      expect(result).toBe(observable);

      observable.value = 20;

      // Wait for async emission
      await Promise.resolve();

      expect(performUpdate).toHaveBeenCalledTimes(2);
    });
  });
});
