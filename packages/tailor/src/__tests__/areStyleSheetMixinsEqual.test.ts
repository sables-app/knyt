/// <reference lib="dom" />
/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test";

import { areStyleSheetMixinsEqual } from "../areStyleSheetMixinsEqual.ts";

describe("areStyleSheetMixinsEqual", () => {
  it("should return true for two undefined mixins", () => {
    const mixinA = undefined;
    const mixinB = undefined;

    expect(areStyleSheetMixinsEqual(mixinA, mixinB)).toBe(true);
  });

  it("should return false for one undefined and one defined mixin", () => {
    const mixinA = { button: { color: "red" } };
    const mixinB = undefined;

    expect(areStyleSheetMixinsEqual(mixinA, mixinB)).toBe(false);
  });

  it("should return true for two equal mixins", () => {
    const mixinA = { button: { color: "red" } };
    const mixinB = { button: { color: "red" } };

    expect(areStyleSheetMixinsEqual(mixinA, mixinB)).toBe(true);
  });

  it("should return false for two different mixins", () => {
    const mixinA = { button: { color: "red" } };
    const mixinB = { button: { color: "blue" } };

    expect(areStyleSheetMixinsEqual(mixinA, mixinB)).toBe(false);
  });

  it("should return true for deeply equal mixins", () => {
    const mixinA = { button: { color: "red", fontSize: "12px" } };
    const mixinB = { button: { color: "red", fontSize: "12px" } };

    expect(areStyleSheetMixinsEqual(mixinA, mixinB)).toBe(true);
  });

  it("should return false for deeply different mixins", () => {
    const mixinA = { button: { color: "red", fontSize: "12px" } };
    const mixinB = { button: { color: "red", fontSize: "14px" } };

    expect(areStyleSheetMixinsEqual(mixinA, mixinB)).toBe(false);
  });

  it("should return true for deeply equal mixins with different order", () => {
    const mixinA = { button: { color: "red", fontSize: "12px" } };
    const mixinB = { button: { fontSize: "12px", color: "red" } };

    expect(areStyleSheetMixinsEqual(mixinA, mixinB)).toBe(true);
  });

  it("should return false for mixins with different keys", () => {
    const mixinA = { button: { color: "red" } };
    const mixinB = { link: { color: "red" } };

    expect(areStyleSheetMixinsEqual(mixinA, mixinB)).toBe(false);
  });

  it("should return false for mixins with less keys", () => {
    const mixinA = { button: { color: "red" } };
    const mixinB = { button: { color: "red", fontSize: "12px" } };

    expect(areStyleSheetMixinsEqual(mixinA, mixinB)).toBe(false);
  });

  it("should return false for mixins with more keys", () => {
    const mixinA = { button: { color: "red", fontSize: "12px" } };
    const mixinB = { button: { color: "red" } };

    expect(areStyleSheetMixinsEqual(mixinA, mixinB)).toBe(false);
  });
});
