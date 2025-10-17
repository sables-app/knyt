/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";
import { filter, from, takeLast } from "rxjs";

import { Beacon } from "../Observable/mod.ts";
import { ref } from "../Reference/mod.ts";

describe("rxjs integration", () => {
  describe("Beacon", () => {
    it("should work with takeLast", async () => {
      const countSignaler = Beacon.withEmitter<number>();
      const count$ = countSignaler.beacon;

      const lastTwo = from(count$).pipe(takeLast(2));

      const subscriber = mock();

      lastTwo.subscribe(subscriber);

      countSignaler.next(0);
      countSignaler.next(1);
      countSignaler.next(2);
      countSignaler.next(3);

      countSignaler.complete();

      expect(subscriber.mock.calls.length).toBe(2);
      expect(subscriber).toHaveBeenCalledWith(2);
      expect(subscriber).toHaveBeenCalledWith(3);
    });
  });

  describe("Reference", () => {
    it("should work with filter", async () => {
      const count$ = ref(0);
      const evenNum$ = from(count$).pipe(filter((value) => value % 2 === 0));

      const subscriber = mock();

      evenNum$.subscribe(subscriber);

      // The subscriber should NOT be called synchronously for the initial value
      expect(subscriber).not.toHaveBeenCalled();

      await Promise.resolve();

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenLastCalledWith(0);

      count$.value = 1;

      await Promise.resolve();

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).not.toHaveBeenLastCalledWith(1);

      count$.value = 2;

      await Promise.resolve();

      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).toHaveBeenLastCalledWith(2);

      count$.value = 3;

      await Promise.resolve();

      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).not.toHaveBeenLastCalledWith(3);

      count$.value = 4;

      await Promise.resolve();

      expect(subscriber).toHaveBeenCalledTimes(3);
      expect(subscriber).toHaveBeenLastCalledWith(4);
    });
  });

  describe("ref.from", () => {
    it("should create a Knyt Reference from an RxJS Observable", async () => {
      const numbers$ = from([1, 2, 3, 4, 5]);
      const state$ = ref.from(numbers$, 0);
      const subscriber = mock();

      state$.subscribe(subscriber);

      // All side effects are asynchronous
      expect(subscriber).not.toHaveBeenCalled();

      // Because RxJS emits the the values synchronously from an array,
      // we only need to wait for the next microtask for all of the values
      // to be emitted.
      await Promise.resolve();

      expect(subscriber).toHaveBeenCalledTimes(6);
      expect(subscriber).toHaveBeenNthCalledWith(1, 0);
      expect(subscriber).toHaveBeenNthCalledWith(2, 1);
      expect(subscriber).toHaveBeenNthCalledWith(3, 2);
      expect(subscriber).toHaveBeenNthCalledWith(4, 3);
      expect(subscriber).toHaveBeenNthCalledWith(5, 4);
      expect(subscriber).toHaveBeenNthCalledWith(6, 5);
    });
  });
});
