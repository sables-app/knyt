/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import {
  sequentialPairs,
  type SequentialPair,
  type Subscription,
} from "../Observable/mod";
import { createReference } from "../Reference/mod";
import { chain } from "../utils/mod";

describe("chain", () => {
  it("should chain transformations", () => {
    const MONTHS_COUNT = 3 as const;
    const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

    const result = chain(MONTHS_COUNT)
      .map((num) => {
        // The type should be inferred as exactly `3`
        expect<3>(num);
        expect<typeof MONTHS_COUNT>(num).toBe(MONTHS_COUNT);

        return num * DAYS_30_MS;
      })
      .map((product) => {
        expect<number>(product).toBe(MONTHS_COUNT * DAYS_30_MS);

        return new Date(product);
      })
      .map((date) => {
        expect<Date>(date).toBeInstanceOf(Date);

        return date.toLocaleDateString();
      })
      .get();

    const expected = new Date(MONTHS_COUNT * DAYS_30_MS).toLocaleDateString();

    expect(result).toBe(expected);
  });

  it("should work with external transformers", async () => {
    const counter$ = createReference(0);
    const listener = mock((_valuePair: SequentialPair<number>) => {});
    const subscription = chain(listener)
      .map((observer) => sequentialPairs<number>(counter$.value, observer))
      .map((observer) => counter$.subscribe(observer))
      .get();

    expect<Subscription>(subscription).toHaveProperty("unsubscribe");
  });
});
