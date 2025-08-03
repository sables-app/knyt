/// <reference types="bun-types" />
/// <reference lib="dom" />

import { describe, expect, it } from "bun:test";

import { shallowEqual } from "../utils/mod";

describe("shallowEqual", () => {
  it("should return true for the same object reference", () => {
    const obj = { a: 1, b: 2 };

    expect(shallowEqual(obj, obj)).toBe(true);
  });

  it("should return true for objects with the same properties and values", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };

    expect(shallowEqual(obj1, obj2)).toBe(true);
  });

  it("should return false for objects with different properties", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };

    expect(shallowEqual(obj1, obj2)).toBe(false);
  });

  it("should return false for objects with different number of properties", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1 };

    expect(shallowEqual(obj1, obj2)).toBe(false);
  });

  it("should return false if one object is undefined", () => {
    const obj1 = { a: 1, b: 2 };

    expect(shallowEqual(obj1, undefined)).toBe(false);
    expect(shallowEqual(undefined, obj1)).toBe(false);
  });

  it("should return true if both objects are undefined", () => {
    expect(shallowEqual(undefined, undefined)).toBe(true);
  });

  it("should use custom equality function if provided", () => {
    type CustomType = { a: number; b: number | string };
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: "2" };
    const customEqual = (a: string | number, b: string | number) => a == b;

    expect(shallowEqual<CustomType>(obj1, obj2, customEqual)).toBe(true);
  });

  it("should return false for objects with different keys", () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, c: 2 };

    expect(shallowEqual<any>(obj1, obj2)).toBe(false);
  });

  it("should return false for arrays with different lengths", () => {
    const arr1 = [1, 2];
    const arr2 = [1];

    expect(shallowEqual(arr1, arr2)).toBe(false);
  });

  it("should return false for arrays with different values", () => {
    const arr1 = [1, 2];
    const arr2 = [1, 3];

    expect(shallowEqual(arr1, arr2)).toBe(false);
  });

  it("should return true for arrays with the same values", () => {
    const arr1 = [1, 2];
    const arr2 = [1, 2];

    expect(shallowEqual(arr1, arr2)).toBe(true);
  });

  it("should return true for arrays with one being undefined", () => {
    const arr1 = [1, 2];

    expect(shallowEqual(arr1, undefined)).toBe(false);
    expect(shallowEqual(undefined, arr1)).toBe(false);
  });
});
