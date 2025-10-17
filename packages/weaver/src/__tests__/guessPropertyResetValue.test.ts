/// <reference types="bun-types" />
import { describe, expect, it } from "bun:test";

import { guessPropertyResetValue } from "../guessPropertyResetValue.ts";

describe("guessPropertyResetValue", () => {
  it("returns '' for string properties", () => {
    const stringProps = [
      "id",
      "className",
      "title",
      "alt",
      "src",
      "href",
      "name",
      "type",
      "placeholder",
      "value",
    ];

    for (const prop of stringProps) {
      expect(guessPropertyResetValue(undefined, prop)).toBe("");
    }
  });

  it("returns false for boolean properties", () => {
    const booleanProps = [
      "checked",
      "selected",
      "disabled",
      "hidden",
      "readonly",
      "multiple",
    ];

    for (const prop of booleanProps) {
      expect(guessPropertyResetValue(undefined, prop)).toBe(false);
    }
  });

  it("returns 0 for number properties", () => {
    const numberProps = ["tabIndex", "minLength"];

    for (const prop of numberProps) {
      expect(guessPropertyResetValue(undefined, prop)).toBe(0);
    }
  });

  it("returns special value for specialGuesses", () => {
    expect(guessPropertyResetValue(undefined, "maxLength")).toBe(-1);
  });

  it("guesses by previous value if property name is unknown", () => {
    expect(guessPropertyResetValue({ foo: "bar" }, "foo")).toBe("");
    expect(guessPropertyResetValue({ foo: true }, "foo")).toBe(false);
    expect(guessPropertyResetValue({ foo: 123 }, "foo")).toBe(0);
  });

  it("returns undefined for unknown property with no prevProps", () => {
    expect(guessPropertyResetValue(undefined, "unknownProp")).toBeUndefined();
  });

  it("returns undefined for unknown property with prevProps but no value", () => {
    expect(guessPropertyResetValue({}, "unknownProp")).toBeUndefined();
  });

  it("returns undefined for unknown property with prevProps value of unknown type", () => {
    expect(guessPropertyResetValue({ foo: {} }, "foo")).toBeUndefined();
    expect(guessPropertyResetValue({ foo: [] }, "foo")).toBeUndefined();
    expect(guessPropertyResetValue({ foo: null }, "foo")).toBeUndefined();
  });
});
