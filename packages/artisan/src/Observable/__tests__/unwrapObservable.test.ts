/// <reference types="bun-types" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import { Beacon } from "../Beacon.ts";
import type { Observable } from "../types.ts";
import { unwrapObservable } from "../unwrapObservable.ts";

describe("unwrapObservable", () => {
  describe("when provided with a derive handler", () => {
    type OriginValue = { foo$: Observable<number> };

    let fooEmitter: Beacon.WithEmitter<number>;
    let originEmitter: Beacon.WithEmitter<OriginValue>;

    beforeEach(() => {
      fooEmitter = Beacon.withEmitter<number>();
      originEmitter = Beacon.withEmitter<OriginValue>();
    });

    it("should derive a observable", () => {
      const derived = unwrapObservable(
        originEmitter.beacon,
        ({ foo$ }) => foo$,
      );
      const subscriber = mock();

      derived.subscribe(subscriber);

      originEmitter.next({
        foo$: fooEmitter.beacon,
      });

      expect(subscriber).not.toHaveBeenCalled();

      fooEmitter.next(42);

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).lastCalledWith(42);

      originEmitter.next({
        foo$: new Beacon<number>(() => {}),
      });

      expect(subscriber).toHaveBeenCalledTimes(1);

      // Shouldn't cause the derived observable to update
      fooEmitter.next(33);

      expect(subscriber).toHaveBeenCalledTimes(1);

      originEmitter.next({
        foo$: fooEmitter.beacon,
      });

      // Should cause the derived observable to update
      fooEmitter.next(72);

      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).lastCalledWith(72);
    });
  });

  describe("when not provided with a derive handler", () => {
    type OriginValue = Observable<number>;

    let fooEmitter: Beacon.WithEmitter<number>;
    let originEmitter: Beacon.WithEmitter<OriginValue>;

    beforeEach(() => {
      fooEmitter = Beacon.withEmitter<number>();
      originEmitter = Beacon.withEmitter<OriginValue>();
    });

    it("should unwrap a nested observable one level deep", () => {
      const derived = unwrapObservable(originEmitter.beacon);
      const subscriber = mock();

      derived.subscribe(subscriber);

      originEmitter.next(fooEmitter.beacon);

      expect(subscriber).not.toHaveBeenCalled();

      fooEmitter.next(42);

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).lastCalledWith(42);

      originEmitter.next(new Beacon<number>(() => {}));

      expect(subscriber).toHaveBeenCalledTimes(1);

      // Shouldn't cause the derived observable to update
      fooEmitter.next(33);

      expect(subscriber).toHaveBeenCalledTimes(1);

      originEmitter.next(fooEmitter.beacon);

      // Should cause the derived observable to update
      fooEmitter.next(72);

      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).lastCalledWith(72);
    });
  });
});
