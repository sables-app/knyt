/// <reference types="bun-types" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import { Beacon } from "../Beacon";
import { filterObservable } from "../filterObservable";
import type { Observable } from "../types";

describe("filterObservable", () => {
  let sourceEmitter: Beacon.WithEmitter<number>;
  let source: Observable<number>;

  beforeEach(() => {
    sourceEmitter = Beacon.withEmitter<number>();
    source = sourceEmitter.beacon;
  });

  it("should emit values that pass the filter", () => {
    const filtered = filterObservable(source, (value) => value % 2 === 0);
    const subscriber = mock();

    filtered.subscribe(subscriber);

    sourceEmitter.next(1);
    sourceEmitter.next(2);
    sourceEmitter.next(3);
    sourceEmitter.next(4);

    expect(subscriber.mock.calls).toEqual([[2], [4]]);
  });

  it("should not emit values that do not pass the filter", () => {
    const filtered = filterObservable(source, (value) => value > 10);
    const subscriber = mock();

    filtered.subscribe(subscriber);

    sourceEmitter.next(5);
    sourceEmitter.next(8);
    sourceEmitter.next(12);

    expect(subscriber.mock.calls).toEqual([[12]]);
  });

  it("should support unsubscribing", () => {
    const filtered = filterObservable(source, (value) => value < 10);
    const subscriber = mock();

    const subscription = filtered.subscribe(subscriber);

    sourceEmitter.next(3);
    sourceEmitter.next(7);

    subscription.unsubscribe();

    sourceEmitter.next(2);
    sourceEmitter.next(5);

    expect(subscriber.mock.calls).toEqual([[3], [7]]);
  });

  it("should handle no values emitted", () => {
    const filtered = filterObservable(source, () => true);
    const subscriber = mock();

    filtered.subscribe(subscriber);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("should handle filter that always returns false", () => {
    const filtered = filterObservable(source, () => false);
    const subscriber = mock();

    filtered.subscribe(subscriber);

    sourceEmitter.next(1);
    sourceEmitter.next(2);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("can be curried", () => {
    const filterEven = filterObservable<number>((value) => value % 2 === 0);
    const subscriber = mock();

    filterEven(source).subscribe(subscriber);

    sourceEmitter.next(1);
    sourceEmitter.next(2);
    sourceEmitter.next(3);
    sourceEmitter.next(4);

    expect(subscriber.mock.calls).toEqual([[2], [4]]);
  });
});
