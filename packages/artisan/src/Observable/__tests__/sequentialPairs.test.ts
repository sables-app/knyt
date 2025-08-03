/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { Beacon } from "../Beacon";
import { sequentialPairs, type SequentialPair } from "../sequentialPairs";
import type { Subscription } from "../types";

describe("sequentialPairs", () => {
  it("creates an observer that emits sequential pairs of values", async () => {
    const emitter = Beacon.withEmitter<number>();
    const counter$ = emitter.beacon;
    const handler = mock((_valuePair: SequentialPair<number>) => {});
    const subscription = counter$.subscribe(
      sequentialPairs<number>(0, handler),
    );

    expect<Subscription>(subscription).toHaveProperty("unsubscribe");

    emitter.next(0);
    emitter.next(0);
    emitter.next(1);
    emitter.next(2);
    emitter.next(3);
    subscription.unsubscribe();
    emitter.next(4);

    expect(handler).toHaveBeenCalledTimes(5);
    expect(handler.mock.calls[0][0]).toEqual([0, 0]);
    expect(handler.mock.calls[1][0]).toEqual([0, 0]);
    expect(handler.mock.calls[2][0]).toEqual([0, 1]);
    expect(handler.mock.calls[3][0]).toEqual([1, 2]);
    expect(handler.mock.calls[4][0]).toEqual([2, 3]);
    expect(handler.mock.calls[5]).toBeUndefined();
  });
});
