/// <reference lib="dom" />
/// <reference types="bun-types" />

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import { cssTemplateTag } from "../cssTemplateTag";
import { StyleSheet } from "../StyleSheet";

describe("cssTemplateTag", () => {
  it("should return a StyleSheet instance with the correct CSS string for plain strings", () => {
    // prettier-ignore
    const result = cssTemplateTag`body { color: red; }`;

    expect(result).toBeInstanceOf(StyleSheet);
    expect(result.toCSSString()).toBe("body { color: red; }\n");
  });

  it("should interpolate string values correctly", () => {
    const color = "blue";
    // prettier-ignore
    const result = cssTemplateTag`body { color: ${color}; }`;

    expect(result.toCSSString()).toBe("body { color: blue; }\n");
  });

  it("should interpolate numeric values correctly", () => {
    const fontSize = 16;
    // prettier-ignore
    const result = cssTemplateTag`body { font-size: ${fontSize}px; }`;

    expect(result.toCSSString()).toBe("body { font-size: 16px; }\n");
  });

  it("should interpolate StyleSheet instances correctly", () => {
    const nestedStyleSheet = StyleSheet.fromCSS("p { margin: 0; }");
    // prettier-ignore
    const result = cssTemplateTag`body { ${nestedStyleSheet} }`;

    expect(result.toCSSString()).toBe("body { p { margin: 0; }\n }\n");
  });

  it("should interpolate CSSStyleSheet instances correctly", () => {
    const styleSheet = new CSSStyleSheet();

    styleSheet.replaceSync("h1 { font-weight: bold; }");

    // prettier-ignore
    const result = cssTemplateTag`body { ${styleSheet} }`;

    expect(result.toCSSString()).toBe("body { h1 { font-weight: bold; }\n }\n");
  });

  it("should handle mixed interpolations correctly", () => {
    const color = "green";
    const fontSize = 14;
    const nestedStyleSheet = StyleSheet.fromCSS("p { margin: 0; }");
    const result = cssTemplateTag`
      body {
        color: ${color};
        font-size: ${fontSize}px;
        ${nestedStyleSheet}
      }
    `;
    expect(result.toCSSString()).toBe(
      "body {\n        color: green;\n        font-size: 14px;\n        p { margin: 0; }\n\n      }\n",
    );
  });

  describe("when an unsupported value type is provided", () => {
    let originalConsoleError: typeof console.error;

    beforeEach(() => {
      originalConsoleError = console.error;
      console.error = mock();
    });

    afterEach(() => {
      console.error = originalConsoleError;
    });

    it("should log a type error for unsupported value types", () => {
      cssTemplateTag`
        body {
          ${null as any}
        }
      `;

      expect(console.error).toHaveBeenCalledWith(
        new TypeError(
          `Unsupported value type: object. Expected string, number, CSSStyleSheet, or CSSSerializable.`,
        ),
      );
    });
  });
});
