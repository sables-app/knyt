import { define, type ElementDefinition } from "@knyt/luthier";
import { dom, isElementBuilder, isViewBuilder } from "@knyt/weaver";
import { describe, expect, it } from "bun:test";

import { KnytTagName } from "../../importTags";
import {
  interpolateInclude,
  isMDXContentFn,
  renderRendererInclude,
} from "../utils";

describe("transform/utils", () => {
  describe("interpolateInclude", () => {
    it("should replace the entire include tag as well as it's children", () => {
      const htmlDocument = `<header><knyt-include src="test.html"><h2>Hello</h2></knyt-include></header>`;
      const renderedIncludeHtml = `<h1>Welcome</h1>`;
      const rewriter = new HTMLRewriter().on(KnytTagName.Include, {
        element: async (includeElement) => {
          await interpolateInclude(includeElement, renderedIncludeHtml);
        },
      });

      const result = rewriter.transform(htmlDocument);

      expect(result).toBe(`<header><h1>Welcome</h1></header>`);
    });

    describe("when the rendered include HTML contains a default slot", () => {
      it("should replace the include tag but retain the children", () => {
        const htmlDocument = `<header><knyt-include src="test.html"><h2>Hello</h2></knyt-include></header>`;
        const renderedIncludeHtml = `<h1>Welcome</h1><knyt-slot></knyt-slot>`;
        const rewriter = new HTMLRewriter().on(KnytTagName.Include, {
          element: async (includeElement) => {
            await interpolateInclude(includeElement, renderedIncludeHtml);
          },
        });

        const result = rewriter.transform(htmlDocument);

        expect(result).toBe(`<header><h1>Welcome</h1><h2>Hello</h2></header>`);
      });
    });
  });

  describe("isMDXContentFn", () => {
    it("should return true for a function that is a MDX content function", () => {
      function MDXContent({ children, ...props }: any) {
        return dom.h1.$props(props).$(children);
      }

      expect(isMDXContentFn(MDXContent)).toBe(true);
    });
  });

  describe("renderRendererInclude", () => {
    describe("when given a MDX function", () => {
      it("should render the MDX content", () => {
        function MDXContent({ children, ...props }: any) {
          return dom.h1.$props(props).$(...children);
        }

        const result = renderRendererInclude(
          MDXContent as any,
          { className: "test-class" },
          ["Hello World"],
        );

        expect(isElementBuilder(result)).toBe(true);
      });
    });

    describe("when given a Custom Element constructor", () => {
      it("should render the Custom Element", () => {
        class JumboSectionElement extends HTMLElement {}
        customElements.define("jumbo-section", JumboSectionElement);

        const result = renderRendererInclude(
          JumboSectionElement,
          { className: "test-class" },
          ["Hello World"],
        );

        expect(isElementBuilder(result)).toBe(true);
      });
    });

    describe("when given a template", () => {
      it("should render the template", () => {
        const MyContent = define.view((props, { children }) =>
          dom.section.$props(props).dataset({ myContent: "true" }).$(children),
        );

        const result = renderRendererInclude(
          MyContent,
          { className: "test-class" },
          ["Hello World"],
        );

        expect(isViewBuilder(result)).toBe(true);
      });
    });

    describe("when given a element definition", () => {
      it("should render the element definition", () => {
        const PowerElement = define.element("knyt-power", {
          properties: {
            powerLevel: define.prop.bigint,
          },
          lifecycle() {
            return () =>
              dom.div
                .dataset({ bigPower: "true" })
                .$(dom.span.$(this.powerLevel?.toString()));
          },
        });

        const result = renderRendererInclude(
          PowerElement as unknown as ElementDefinition.Fn<
            Record<string, unknown>
          >,
          { className: "test-class", powerLevel: 9001n },
          [],
        );

        expect(isElementBuilder(result)).toBe(true);
      });
    });
  });
});
