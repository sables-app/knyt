/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { Beacon } from "../Beacon";
import { DynamicObserver } from "../DynamicObserver";
import type { Observable } from "../types";

describe("DynamicObserver", () => {
  it("forwards next values to the current subscriber", () => {
    const observerEmitter = Beacon.withEmitter<Observable.Subscriber<number>>();
    const valueEmitter = Beacon.withEmitter<number>();
    const dynamicObserver = new DynamicObserver(observerEmitter.beacon);

    const firstSubscriber = mock((value: number) => {});
    const secondSubscriber = mock((value: number) => {});
    const thirdSubscriber = mock((value: number) => {});

    valueEmitter.beacon.subscribe(dynamicObserver);

    valueEmitter.next(1);

    expect(firstSubscriber).not.toHaveBeenCalled();
    expect(secondSubscriber).not.toHaveBeenCalled();
    expect(thirdSubscriber).not.toHaveBeenCalled();

    observerEmitter.next(firstSubscriber);

    valueEmitter.next(2);

    expect(firstSubscriber).toHaveBeenCalledTimes(1);
    expect(firstSubscriber).toHaveBeenLastCalledWith(2);
    expect(secondSubscriber).not.toHaveBeenCalled();
    expect(thirdSubscriber).not.toHaveBeenCalled();

    valueEmitter.next(3);

    expect(firstSubscriber).toHaveBeenCalledTimes(2);
    expect(firstSubscriber).toHaveBeenLastCalledWith(3);
    expect(secondSubscriber).not.toHaveBeenCalled();
    expect(thirdSubscriber).not.toHaveBeenCalled();

    observerEmitter.next(secondSubscriber);

    valueEmitter.next(4);

    expect(firstSubscriber).toHaveBeenCalledTimes(2);
    expect(secondSubscriber).toHaveBeenCalledTimes(1);
    expect(secondSubscriber).toHaveBeenLastCalledWith(4);
    expect(thirdSubscriber).not.toHaveBeenCalled();

    dynamicObserver.unsubscribe();

    observerEmitter.next(thirdSubscriber);

    valueEmitter.next(5);

    expect(firstSubscriber).toHaveBeenCalledTimes(2);
    expect(secondSubscriber).toHaveBeenCalledTimes(2);
    expect(secondSubscriber).toHaveBeenLastCalledWith(5);
    expect(thirdSubscriber).not.toHaveBeenCalled();
  });
});
