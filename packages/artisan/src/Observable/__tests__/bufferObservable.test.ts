/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { Beacon } from "../Beacon";
import { BufferedObservable, bufferObservable } from "../bufferObservable";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("bufferObservable", () => {
  describe("bufferObservable", () => {
    it("buffers events and emits them as an array after the specified time span", async () => {
      const source = Beacon.withEmitter<number>();
      const timeSpan = 50;
      const subscriber = mock();

      bufferObservable(source.beacon, timeSpan).subscribe(subscriber);

      source.next(1);
      source.next(2);

      await wait(timeSpan + 10);

      expect(subscriber).toHaveBeenCalledWith([1, 2]);
    });

    it("emits multiple buffers if events are spaced out", async () => {
      const source = Beacon.withEmitter<number>();
      const timeSpan = 30;
      const subscriber = mock();

      bufferObservable(source.beacon, timeSpan).subscribe(subscriber);

      source.next(1);
      await wait(timeSpan + 5);
      source.next(2);
      source.next(3);
      await wait(timeSpan + 5);

      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).toHaveBeenNthCalledWith(1, [1]);
      expect(subscriber).toHaveBeenNthCalledWith(2, [2, 3]);
    });

    it("does not emit an empty buffer", async () => {
      const source = Beacon.withEmitter<number>();
      const timeSpan = 20;
      const subscriber = mock();

      bufferObservable(source.beacon, timeSpan).subscribe(subscriber);

      await wait(timeSpan + 10);

      expect(subscriber).not.toHaveBeenCalled();
    });

    it("groups events that occur within the time span", async () => {
      const source = Beacon.withEmitter<number>();
      const timeSpan = 40;
      const subscriber = mock();

      bufferObservable(source.beacon, timeSpan).subscribe(subscriber);

      source.next(1);
      await wait(timeSpan - 10);
      source.next(2);
      await wait(timeSpan + 10);

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith([1, 2]);
    });

    it("handles rapid succession of events", async () => {
      const source = Beacon.withEmitter<number>();
      const timeSpan = 10;
      const subscriber = mock();

      bufferObservable(source.beacon, timeSpan).subscribe(subscriber);

      for (let i = 0; i < 5; i++) {
        source.next(i);
      }

      await wait(timeSpan + 20);

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith([0, 1, 2, 3, 4]);
    });
  });
});

describe("BufferedObservable", () => {
  it("can observe multiple sources sequentially", async () => {
    const source1 = Beacon.withEmitter<number>();
    const source2 = Beacon.withEmitter<number>();
    const timeSpan = 30;
    const subscriber = mock();

    const bufferedObservable = new BufferedObservable<number>(timeSpan);

    bufferedObservable.subscribe(subscriber);
    source2.beacon.subscribe(bufferedObservable);
    source1.beacon.subscribe(bufferedObservable);

    source1.next(1);
    source1.next(2);

    await wait(timeSpan + 10);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenNthCalledWith(1, [1, 2]);

    source2.next(3);
    source2.next(4);

    await wait(timeSpan + 10);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenNthCalledWith(2, [3, 4]);
  });

  it("upon completion, emits any remaining buffered events before completing", async () => {
    const source = Beacon.withEmitter<number>();
    const timeSpan = 50;
    const subscriber = mock();

    const bufferedObservable = new BufferedObservable<number>(timeSpan);

    bufferedObservable.subscribe(subscriber);
    source.beacon.subscribe(bufferedObservable);

    source.next(1);
    source.next(2);

    await wait(timeSpan / 2);

    source.complete();

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenNthCalledWith(1, [1, 2]);
  });

  it("upon error, emits any remaining buffered events before erroring", async () => {
    const source = Beacon.withEmitter<number>();
    const timeSpan = 50;
    const subscriber = mock();

    const bufferedObservable = new BufferedObservable<number>(timeSpan);

    bufferedObservable.subscribe(subscriber);
    source.beacon.subscribe(bufferedObservable);

    source.next(1);
    source.next(2);

    await wait(timeSpan / 2);

    const error = new Error("Test error");

    source.error(error);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenNthCalledWith(1, [1, 2]);
  });

  it("does not emit after completion", async () => {
    const source = Beacon.withEmitter<number>();
    const timeSpan = 30;
    const subscriber = mock();

    const bufferedObservable = new BufferedObservable<number>(timeSpan);

    bufferedObservable.subscribe(subscriber);
    source.beacon.subscribe(bufferedObservable);

    source.next(1);
    source.next(2);

    await wait(timeSpan + 10);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenNthCalledWith(1, [1, 2]);

    bufferedObservable.complete();

    source.next(3);
    source.next(4);

    await wait(timeSpan + 10);

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("does not emit after error", async () => {
    const source = Beacon.withEmitter<number>();
    const timeSpan = 30;
    const subscriber = mock();

    const bufferedObservable = new BufferedObservable<number>(timeSpan);

    bufferedObservable.subscribe(subscriber);
    source.beacon.subscribe(bufferedObservable);

    source.next(1);
    source.next(2);

    await wait(timeSpan + 10);

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenNthCalledWith(1, [1, 2]);

    bufferedObservable.error(new Error("Test error"));

    source.next(3);
    source.next(4);

    await wait(timeSpan + 10);

    expect(subscriber).toHaveBeenCalledTimes(1);
  });
});
