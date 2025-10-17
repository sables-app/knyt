/// <reference lib="dom" />
/// <reference types="bun-types" />

import { build, render } from "@knyt/weaver";
import { beforeEach, describe, expect, it, mock } from "bun:test";

import { StyleSheet } from "../StyleSheet.ts";
import type { CSSRules } from "../types.ts";

describe("StyleSheet", () => {
  describe("static", () => {
    describe("isStyleSheet", () => {
      it("should return true for a StyleSheet instance", () => {
        const styleSheet = new StyleSheet();

        expect(StyleSheet.isStyleSheet(styleSheet)).toBe(true);
      });

      it("should return false for a non-StyleSheet instance", () => {
        const notStyleSheet = {};

        expect(StyleSheet.isStyleSheet(notStyleSheet)).toBe(false);
      });

      it("should return false for a CSSStyleSheet instance", () => {
        const cssStyleSheet = new CSSStyleSheet();

        expect(StyleSheet.isStyleSheet(cssStyleSheet)).toBe(false);
      });
    });
    describe("fromCSSStyleSheet", () => {
      it("should create a StyleSheet from a CSSStyleSheet", () => {
        const cssStyleSheet = new CSSStyleSheet();
        cssStyleSheet.replaceSync(
          ".foo { color: red; }\n.bar { color: blue; }",
        );

        const styleSheet = StyleSheet.fromCSSStyleSheet(cssStyleSheet);

        expect(styleSheet).toBeInstanceOf(StyleSheet);
        expect(styleSheet.toCSSString()).toEqual(
          ".foo { color: red; }\n.bar { color: blue; }\n",
        );
      });
    });

    describe("fromCSS", () => {
      it("should create a StyleSheet from a CSS string", () => {
        const styleSheet = StyleSheet.fromCSS(
          ".foo { color: red; }\n.bar { color: blue; }",
        );

        expect(styleSheet).toBeInstanceOf(StyleSheet);
        expect(styleSheet.toCSSString()).toEqual(
          ".foo { color: red; }\n.bar { color: blue; }\n",
        );
      });
    });

    describe("fromRules", () => {
      it("should create a StyleSheet from a set of rules", () => {
        const styleSheet = StyleSheet.fromRules({
          foo: {
            color: "red",
          },
          bar: {
            color: "blue",
          },
        });

        expect(styleSheet).toBeInstanceOf(StyleSheet);
      });

      it("should have a TypeScript error if a rule is missing", () => {
        StyleSheet.fromRules({
          foo: {
            color: "red",
          },
          bar: {
            color: "blue",
          },
          // @ts-expect-error - The "qux" rule is missing
        } satisfies CSSRules<"foo" | "bar" | "qux">);
      });

      it("should have a TypeScript error if an extra rule is added", () => {
        StyleSheet.fromRules({
          foo: {
            color: "red",
          },
          bar: {
            color: "blue",
          },
          // @ts-expect-error - The "qux" rule is extra
          qux: {
            color: "green",
          },
        } satisfies CSSRules<"foo" | "bar">);
      });
    });
  });

  describe("instance", () => {
    const rules = {
      /**
       * Rule name "foo"
       */
      foo: {
        color: "red",
      },
      bar: {
        color: "blue",
      },
      "bar:hover": {
        color: "green",
      },
    } satisfies CSSRules<"foo" | "bar" | "bar:hover">;

    let styleSheet: StyleSheet<typeof rules>;

    beforeEach(() => {
      styleSheet = StyleSheet.fromRules(rules);
    });

    describe.todo("addRule", () => {});

    describe.todo("include", () => {});

    describe("toCSSString", () => {
      it("should return the CSS for the StyleSheet", () => {
        expect(styleSheet.toCSSString()).toEqual(
          ".knyt-jk0pkr { color: red; }\n.knyt-14jcta0 { color: blue; }\n.knyt-14jcta0:hover { color: green; }\n",
        );
      });
    });

    describe("toString", () => {
      it("should return the CSS for the StyleSheet", () => {
        expect(styleSheet.toString()).toEqual(styleSheet.toCSSString());
      });
    });

    describe("classNames", () => {
      it("should return a map of class names", () => {
        expect(styleSheet.classNames).toEqual({
          foo: "knyt-jk0pkr",
          bar: "knyt-14jcta0",
          "bar:hover": "knyt-1fpqmhj",
        });
      });

      it("should not contain class names for nested rules", () => {
        expect(styleSheet.classNames).not.toHaveProperty("bar&:hover");
      });

      it("should directly reference each class name with its original rule", () => {
        // In VS Code, clicking on the `foo` property below should move the
        // cursor to the `foo` rule in the `rules` object.
        //
        // Hovering over the `foo` property below should show the type of the rule,
        // and the contents of the associated docblock.
        //
        // I don't know how to test this programmatically, but I want to
        // document this behavior so that it's expectation is clear.
        //
        // This is an important feature of the API, because being able to
        // click on the rule name in the classNames map and have it take you
        // to the rule in the rules object is a huge productivity boost.
        styleSheet.classNames.foo;
      });
    });

    describe("style", () => {
      it("should return a Builder to render into a DOM node", async () => {
        const element = await build<HTMLStyleElement>(styleSheet.style());

        expect(element).toBeInstanceOf(HTMLElement);
        expect(element.innerText).toEqual(styleSheet.toCSSString());
      });

      describe("html", () => {
        it("should a Builder to be rendered into HTML", async () => {
          expect(await render(styleSheet.style.html())).toEqual(
            "<style>.knyt-jk0pkr { color: red; }\n.knyt-14jcta0 { color: blue; }\n.knyt-14jcta0:hover { color: green; }\n</style>",
          );
        });
      });
    });

    describe("sx", () => {
      it("dynamically adds a CSS rule", () => {
        expect(styleSheet.classNames).not.toHaveProperty("knyt-1wi9jrc-rule");

        const result = styleSheet.sx({
          color: "yellow",
        });

        const expectedClassName = "knyt-1wi9jrc";

        expect(result).toEqual(expectedClassName);
        expect(styleSheet.classNames).toHaveProperty(
          `${expectedClassName}-rule`,
          expectedClassName,
        );
        expect(styleSheet.toCSSString()).toEqual(
          ".knyt-jk0pkr { color: red; }\n.knyt-14jcta0 { color: blue; }\n.knyt-14jcta0:hover { color: green; }\n.knyt-1wi9jrc { color: yellow; }\n",
        );
      });

      it("is idempotent; i.e. it does not add the same style more than once", () => {
        const expectedClassName = "knyt-1wi9jrc";

        expect(styleSheet.sx({ color: "yellow" })).toEqual(expectedClassName);
        expect(styleSheet.sx({ color: "yellow" })).toEqual(expectedClassName);
        expect(styleSheet.sx({ color: "yellow" })).toEqual(expectedClassName);

        expect(styleSheet.toCSSString()).toEqual(
          ".knyt-jk0pkr { color: red; }\n.knyt-14jcta0 { color: blue; }\n.knyt-14jcta0:hover { color: green; }\n.knyt-1wi9jrc { color: yellow; }\n",
        );
      });
    });

    describe("extend", () => {
      it("should extend the StyleSheet with a mixin", () => {
        const mixin = {
          baz: {
            color: "green",
          },
        };

        const extended = styleSheet.extend(mixin);

        expect(extended.classNames).toEqual({
          foo: "knyt-jk0pkr",
          bar: "knyt-14jcta0",
          "bar:hover": "knyt-1fpqmhj",
          baz: "knyt-1fpqmhj",
        });
        expect(extended).toBeInstanceOf(StyleSheet);
        expect(extended.toCSSString()).toEqual(
          ".knyt-jk0pkr { color: red; }\n.knyt-14jcta0 { color: blue; }\n.knyt-14jcta0:hover { color: green; }\n.knyt-1fpqmhj { color: green; }\n",
        );
      });

      it("should override existing styles", () => {
        const mixin = {
          foo: {
            color: "pink",
          },
        };

        const extended = styleSheet.extend(mixin);

        expect(extended.classNames).toEqual({
          foo: "knyt-1i6sv9y",
          bar: "knyt-14jcta0",
          "bar:hover": "knyt-1fpqmhj",
        });
        expect(extended).toBeInstanceOf(StyleSheet);
        expect(extended.toCSSString()).toEqual(
          ".knyt-1i6sv9y { color: pink; }\n.knyt-14jcta0 { color: blue; }\n.knyt-14jcta0:hover { color: green; }\n",
        );
      });
    });

    describe("equals", () => {
      it("should return true for StyleSheets with the same rules", () => {
        const other = StyleSheet.fromRules(rules);

        expect(styleSheet.equals(other)).toBe(true);
      });

      it("should return false for StyleSheets with different rules", () => {
        const other = StyleSheet.fromRules({
          foo: {
            color: "red",
          },
          bar: {
            color: "blue",
          },
          "bar:hover": {
            color: "yellow", // Different color
          },
        });

        // @ts-expect-error because the types of the rules are different
        expect(styleSheet.equals(other)).toBe(false);
      });
    });
  });

  describe("verbatim selectors", () => {
    it("should render a `:host` rule name verbatim", () => {
      const styleSheet = StyleSheet.fromRules({
        ":host": {
          color: "red",
        },
      });

      expect(styleSheet.toCSSString()).toEqual(":host { color: red; }\n");
    });

    it("should render a `:host-context` rule name verbatim", () => {
      const styleSheet = StyleSheet.fromRules({
        ":host-context(.dark)": {
          color: "white",
        },
      });

      expect(styleSheet.toCSSString()).toEqual(
        ":host-context(.dark) { color: white; }\n",
      );
    });

    it("should render a `::slotted` rule name verbatim", () => {
      const styleSheet = StyleSheet.fromRules({
        "::slotted(*)": {
          color: "blue",
        },
      });

      expect(styleSheet.toCSSString()).toEqual(
        "::slotted(*) { color: blue; }\n",
      );
    });

    it("should render a `:root` rule name verbatim", () => {
      const styleSheet = StyleSheet.fromRules({
        ":root": {
          "--main-color": "blue",
        },
      });

      expect(styleSheet.toCSSString()).toEqual(
        ":root { --main-color: blue; }\n",
      );
    });
  });
});
