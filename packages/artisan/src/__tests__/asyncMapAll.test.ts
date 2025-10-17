/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { asyncMapAll } from "../asyncMapAll.ts";

describe("asyncMapAll", () => {
  it("should map all items when batchSize is null", async () => {
    const input = [1, 2, 3];
    const mapFn = mock((item: number) => Promise.resolve(item * 2));

    const result = await asyncMapAll(input, mapFn, null);

    expect(result).toEqual([2, 4, 6]);
    expect(mapFn).toHaveBeenCalledTimes(3);
    expect(mapFn).toHaveBeenNthCalledWith(1, 1, 0, input);
    expect(mapFn).toHaveBeenNthCalledWith(2, 2, 1, input);
    expect(mapFn).toHaveBeenNthCalledWith(3, 3, 2, input);
  });

  it("should map items in batches when batchSize is provided", async () => {
    const input = [1, 2, 3, 4, 5];
    const mapFn = mock((item: number) => Promise.resolve(item * 2));

    const result = await asyncMapAll(input, mapFn, 2);

    expect(result).toEqual([2, 4, 6, 8, 10]);
    expect(mapFn).toHaveBeenCalledTimes(5);
  });

  it("should handle an empty input array", async () => {
    const input: number[] = [];
    const mapFn = mock((item: number) => Promise.resolve(item * 2));

    const result = await asyncMapAll(input, mapFn, 2);

    expect(result).toEqual([]);
    expect(mapFn).not.toHaveBeenCalled();
  });

  it("should handle batchSize larger than input array length", async () => {
    const input = [1, 2];
    const mapFn = mock((item: number) => Promise.resolve(item * 2));

    const result = await asyncMapAll(input, mapFn, 10);

    expect(result).toEqual([2, 4]);
    expect(mapFn).toHaveBeenCalledTimes(2);
  });

  it("should handle batchSize of 1", async () => {
    const input = [1, 2, 3];
    const mapFn = mock((item: number) => Promise.resolve(item * 2));

    const result = await asyncMapAll(input, mapFn, 1);

    expect(result).toEqual([2, 4, 6]);
    expect(mapFn).toHaveBeenCalledTimes(3);
  });

  it("should propagate errors from the map function", async () => {
    const input = [1, 2, 3];
    const mapFn = mock((item: number) =>
      item === 2
        ? Promise.reject(new Error("Test error"))
        : Promise.resolve(item * 2),
    );

    await expect(asyncMapAll(input, mapFn, 2)).rejects.toThrow("Test error");
    // Stops on the batch with the error
    expect(mapFn).toHaveBeenCalledTimes(2);
  });
});
