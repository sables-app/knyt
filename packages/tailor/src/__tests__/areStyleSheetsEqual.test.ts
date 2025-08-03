/// <reference lib="dom" />
/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test";

import { areStyleSheetsEqual } from "../areStyleSheetsEqual";
import { StyleSheet } from "../StyleSheet";

describe("areStyleSheetsEqual", () => {
  it("should return true if both style sheets are the same instance", () => {
    const styleSheet = StyleSheet.fromRules({ button: { color: "red" } });

    expect(areStyleSheetsEqual(styleSheet, styleSheet)).toBe(true);
  });

  it("should return false if one of the style sheets is undefined", () => {
    const styleSheet = StyleSheet.fromRules({ button: { color: "red" } });

    expect(areStyleSheetsEqual(styleSheet, undefined)).toBe(false);
    expect(areStyleSheetsEqual(undefined, styleSheet)).toBe(false);
  });

  it("should return true if both style sheets are undefined", () => {
    expect(areStyleSheetsEqual(undefined, undefined)).toBe(true);
  });

  it("should return the true if the stylesheets are equivalent", () => {
    const styleSheetA = StyleSheet.fromRules({ button: { color: "red" } });
    const styleSheetB = StyleSheet.fromRules({ button: { color: "red" } });

    expect(areStyleSheetsEqual(styleSheetA, styleSheetB)).toBe(true);
  });

  it("should return false if the style properties are different", () => {
    const styleSheetA = StyleSheet.fromRules({ button: { color: "red" } });
    const styleSheetB = StyleSheet.fromRules({ button: { color: "blue" } });

    expect(areStyleSheetsEqual(styleSheetA, styleSheetB)).toBe(false);
  });

  // This shouldn't be possible, because the types should prevent it,
  // but it's a good sanity check.
  it("should return false if the style rule names are different", () => {
    const styleSheetA = StyleSheet.fromRules({ button: { color: "red" } });
    const styleSheetB = StyleSheet.fromRules({ link: { color: "red" } });

    expect(areStyleSheetsEqual(styleSheetA, styleSheetB)).toBe(false);
  });

  it("should return false if the selectors are different", () => {
    const styleSheetA = StyleSheet.fromRules({
      button: { color: "red" },
    });
    const styleSheetB = StyleSheet.fromRules({
      button: {
        selector: () => "button",
        styles: { color: "red" },
      },
    });

    expect(areStyleSheetsEqual(styleSheetA, styleSheetB)).toBe(false);
  });

  it("should return true if the selectors are equivalent", () => {
    const styleSheetA = StyleSheet.fromRules({
      button: { color: "red" },
    });
    const styleSheetB = StyleSheet.fromRules({
      button: {
        selector: ({ button }) => `.${button}`,
        styles: { color: "red" },
      },
    });

    expect(areStyleSheetsEqual(styleSheetA, styleSheetB)).toBe(true);
  });

  it("should return false if the style rules are in different order", () => {
    const styleSheetA = StyleSheet.fromRules({
      button: { color: "red" },
      link: { color: "blue" },
    });
    const styleSheetB = StyleSheet.fromRules({
      link: { color: "blue" },
      button: { color: "red" },
    });

    expect(areStyleSheetsEqual(styleSheetA, styleSheetB)).toBe(false);
  });

  // This shouldn't be possible, because the types should prevent it,
  // but it's a good sanity check.
  it("should return false if one style sheet has extra rules", () => {
    const styleSheetA = StyleSheet.fromRules({ button: { color: "red" } });
    const styleSheetB = StyleSheet.fromRules({
      button: { color: "red" },
      link: { color: "blue" },
    });

    expect(areStyleSheetsEqual(styleSheetA, styleSheetB)).toBe(false);
  });
});
