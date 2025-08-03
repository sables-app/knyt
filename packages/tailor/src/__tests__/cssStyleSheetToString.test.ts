/// <reference lib="dom" />
/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test";

import { cssStyleSheetToString } from "../cssStyleSheetToString";

describe("cssStyleSheetToString", () => {
  it("should convert a CSSStyleSheet with style rules to a string", () => {
    const styleSheet = {
      cssRules: [
        {
          selectorText: ".example",
          style: { cssText: "color: red;" },
          type: 1,
        },
      ],
    } as unknown as CSSStyleSheet;

    const result = cssStyleSheetToString(styleSheet);

    expect(result).toBe(".example { color: red; }\n");
  });

  it("should include media queries when includeMediaQueries is true", () => {
    const styleSheet = {
      cssRules: [
        {
          media: { mediaText: "screen and (max-width: 600px)" },
          cssRules: [
            {
              selectorText: ".example",
              style: { cssText: "color: blue;" },
              type: 1,
            },
          ],
          type: 4,
        },
      ],
    } as unknown as CSSStyleSheet;

    const result = cssStyleSheetToString(styleSheet, {
      includeMediaQueries: true,
    });

    expect(result).toBe(
      "@media screen and (max-width: 600px) {\n.example { color: blue; }\n}\n",
    );
  });

  it("should exclude media queries when includeMediaQueries is false", () => {
    const styleSheet = {
      cssRules: [
        {
          media: { mediaText: "screen and (max-width: 600px)" },
          cssRules: [
            {
              selectorText: ".example",
              style: { cssText: "color: blue;" },
              type: 1,
            },
          ],
          type: 4,
        },
      ],
    } as unknown as CSSStyleSheet;

    const result = cssStyleSheetToString(styleSheet, {
      includeMediaQueries: false,
    });

    expect(result).toBe("");
  });

  it("should handle an empty CSSStyleSheet", () => {
    const styleSheet = {
      cssRules: [],
    } as unknown as CSSStyleSheet;

    const result = cssStyleSheetToString(styleSheet);

    expect(result).toBe("");
  });

  it("should convert a CSSStyleSheet instance with style rules to a string", () => {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .global-example {
        background-color: yellow;
      }
    `;
    document.head.appendChild(styleElement);

    const styleSheet = styleElement.sheet!;

    const result = cssStyleSheetToString(styleSheet);

    expect(result).toBe(".global-example { background-color: yellow; }\n");

    document.head.removeChild(styleElement);
  });

  it("should include media queries in a CSSStyleSheet instance when includeMediaQueries is true", () => {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @media screen and (max-width: 600px) {
        .global-example {
          font-size: 14px;
        }
      }
    `;
    document.head.appendChild(styleElement);

    const styleSheet = styleElement.sheet!;

    const result = cssStyleSheetToString(styleSheet, {
      includeMediaQueries: true,
    });

    expect(result).toBe(
      "@media screen and (max-width: 600px) {\n.global-example { font-size: 14px; }\n}\n",
    );

    document.head.removeChild(styleElement);
  });

  it("should exclude media queries in a CSSStyleSheet instance when includeMediaQueries is false", () => {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @media screen and (max-width: 600px) {
        .global-example {
          font-size: 14px;
        }
      }
    `;
    document.head.appendChild(styleElement);

    const styleSheet = styleElement.sheet!;

    const result = cssStyleSheetToString(styleSheet, {
      includeMediaQueries: false,
    });

    expect(result).toBe("");

    document.head.removeChild(styleElement);
  });

  it("should handle a CSSStyleSheet instance with no rules", () => {
    const styleElement = document.createElement("style");
    document.head.appendChild(styleElement);

    const styleSheet = styleElement.sheet!;

    const result = cssStyleSheetToString(styleSheet);

    expect(result).toBe("");

    document.head.removeChild(styleElement);
  });
});
