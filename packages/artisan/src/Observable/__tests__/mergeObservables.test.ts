/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { Beacon } from "../Beacon.ts";
import { mergeObservables } from "../mergeObservables.ts";
import type { Subscription } from "../types.ts";

describe("mergeObservables", () => {
  it("merges multiple observables into a single observable", async () => {
    const emitter1 = Beacon.withEmitter<number>();
    const emitter2 = Beacon.withEmitter<string>();
    const merged$ = mergeObservables(emitter1.beacon, emitter2.beacon);
    const handler = mock((value: number | string) => {});
    const subscription = merged$.subscribe(handler);

    expect<Subscription>(subscription).toHaveProperty("unsubscribe");

    emitter1.next(1);
    emitter2.next("a");
    emitter1.next(2);
    emitter2.next("b");
    subscription.unsubscribe();
    emitter1.next(3);
    emitter2.next("c");

    expect(handler).toHaveBeenCalledTimes(4);
    expect(handler.mock.calls[0][0]).toBe(1);
    expect(handler.mock.calls[1][0]).toBe("a");
    expect(handler.mock.calls[2][0]).toBe(2);
    expect(handler.mock.calls[3][0]).toBe("b");
  });
});
