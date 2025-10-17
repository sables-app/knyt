/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { Beacon } from "../Beacon.ts";
import { mapObservable, MappedObservable } from "../mapObservable.ts";

function transform(value: number): string {
  return String(value);
}

describe("mapObservable", () => {
  describe("mapObservable", () => {
    it("transforms events emitted by the source observable", async () => {
      const source = Beacon.withEmitter<number>();
      const subscriber = mock();

      mapObservable(source.beacon, transform).subscribe(subscriber);

      source.next(1);
      source.next(2);

      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).toHaveBeenNthCalledWith(1, "1");
      expect(subscriber).toHaveBeenNthCalledWith(2, "2");
    });

    it("forwards completion from the source observable", async () => {
      const source = Beacon.withEmitter<number>();
      const observer = {
        next: mock(),
        complete: mock(),
        error: mock(),
      };

      mapObservable(source.beacon, transform).subscribe(observer);

      source.next(1);
      source.complete();

      expect(observer.next).toHaveBeenCalledTimes(1);
      expect(observer.next).toHaveBeenNthCalledWith(1, "1");
      expect(observer.complete).toHaveBeenCalledTimes(1);
      expect(observer.error).not.toHaveBeenCalled();
    });

    it("forwards errors from the source observable", async () => {
      const source = Beacon.withEmitter<number>();
      const observer = {
        next: mock(),
        complete: mock(),
        error: mock(),
      };

      mapObservable(source.beacon, transform).subscribe(observer);

      source.next(1);
      const error = new Error("Test error");
      source.error(error);

      expect(observer.next).toHaveBeenCalledTimes(1);
      expect(observer.next).toHaveBeenNthCalledWith(1, "1");
      expect(observer.error).toHaveBeenCalledTimes(1);
      expect(observer.error).toHaveBeenNthCalledWith(1, error);
      expect(observer.complete).not.toHaveBeenCalled();
    });
  });
});

describe("MappedObservable", () => {
  it("can observe multiple sources sequentially", async () => {
    const source1 = Beacon.withEmitter<number>();
    const source2 = Beacon.withEmitter<number>();
    const subscriber = mock();

    const mappedObservable = new MappedObservable(transform);

    mappedObservable.subscribe(subscriber);
    source2.beacon.subscribe(mappedObservable);
    source1.beacon.subscribe(mappedObservable);

    source1.next(1);
    source1.next(2);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenNthCalledWith(1, "1");
    expect(subscriber).toHaveBeenNthCalledWith(2, "2");

    source2.next(3);
    source2.next(4);

    expect(subscriber).toHaveBeenCalledTimes(4);
    expect(subscriber).toHaveBeenNthCalledWith(3, "3");
    expect(subscriber).toHaveBeenNthCalledWith(4, "4");
  });

  it("does not emit after completion", async () => {
    const source = Beacon.withEmitter<number>();
    const subscriber = mock();
    const mappedObservable = new MappedObservable(transform);

    mappedObservable.subscribe(subscriber);
    source.beacon.subscribe(mappedObservable);

    source.next(1);
    source.next(2);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenNthCalledWith(1, "1");
    expect(subscriber).toHaveBeenNthCalledWith(2, "2");

    mappedObservable.complete();

    source.next(3);
    source.next(4);

    expect(subscriber).toHaveBeenCalledTimes(2);
  });

  it("does not emit after error", async () => {
    const source = Beacon.withEmitter<number>();
    const subscriber = mock();
    const mappedObservable = new MappedObservable(transform);

    mappedObservable.subscribe(subscriber);
    source.beacon.subscribe(mappedObservable);

    source.next(1);
    source.next(2);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(subscriber).toHaveBeenNthCalledWith(1, "1");
    expect(subscriber).toHaveBeenNthCalledWith(2, "2");

    mappedObservable.error(new Error("Test error"));

    source.next(3);
    source.next(4);

    expect(subscriber).toHaveBeenCalledTimes(2);
  });
});
