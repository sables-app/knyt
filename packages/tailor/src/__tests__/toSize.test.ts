import { describe, expect, it } from "bun:test";

import { CSSLength } from "../CSSLength.ts";
import { CSSPercentage } from "../CSSPercentage.ts";
import { toSize } from "../toSize.ts";

describe("toSize", () => {
  it("returns CSSLength instance when given a CSSLength", () => {
    const px = CSSLength.from("10px");

    expect(toSize(px)).toBe(px);
  });

  it("returns CSSPercentage instance when given a CSSPercentage", () => {
    const pct = CSSPercentage.from("50%");

    expect(toSize(pct)).toBe(pct);
  });

  it("parses string px value to CSSLength", () => {
    const result = toSize("12px");

    expect(result).toBeInstanceOf(CSSLength);
    expect(result.valueOf()).toBe(12);
  });

  it("parses number to CSSLength (assumes px)", () => {
    const result = toSize(15);

    expect(result).toBeInstanceOf(CSSLength);
    expect(result.valueOf()).toBe(15);
  });

  it("parses string percentage to CSSPercentage", () => {
    const result = toSize("25%");

    expect(result).toBeInstanceOf(CSSPercentage);
    expect(result.valueOf()).toBe(0.25);
  });

  it("parses rem value with baseFontSizePx", () => {
    const result = toSize("2rem", 20);

    expect(result).toBeInstanceOf(CSSLength);
    expect(result.valueOf()).toBe(40);
  });

  it("doesn't parse em values", () => {
    expect(() => toSize("2em", 20)).toThrow(TypeError);
  });

  it("returns undefined if value is undefined", () => {
    expect(toSize(undefined)).toBeUndefined();
  });

  it("throws TypeError for unrecognized value", () => {
    expect(() => toSize("foo")).toThrow(TypeError);
  });

  it("throws TypeError for unrecognized value with baseFontSizePx", () => {
    expect(() => toSize("foo", 16)).toThrow(TypeError);
  });

  it("returns undefined if value is undefined and baseFontSizePx is provided", () => {
    expect(toSize(undefined, 16)).toBeUndefined();
  });

  it("parses px value with baseFontSizePx", () => {
    const result = toSize("10px", 16);

    expect(result).toBeInstanceOf(CSSLength);
    expect(result.valueOf()).toBe(10);
  });

  it("parses number with baseFontSizePx (assumes px)", () => {
    const result = toSize(8, 16);

    expect(result).toBeInstanceOf(CSSLength);
    expect(result.valueOf()).toBe(8);
  });

  it("doesn't parse percentage string with baseFontSizePx", () => {
    expect(() => toSize("80%", 16)).toThrow(TypeError);
  });
});
