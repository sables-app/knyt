// @jsx jsx
// @jsxFrag Fragment
// @jsxImportSource .

import { beforeAll, describe, expect, it, mock } from "bun:test";

import { build } from "../build/mod.ts";
import { jsx } from "../jsx.ts";
import type { ElementBuilder } from "../types/mod.ts";
import { getElementDeclarationKey } from "../utils/mod.ts";

describe("jsx function", async () => {
  // This is a unique tag name to potentially avoid conflicts with other tests
  // that may be running in the same environment.
  const customElementTagName = "element-00107c2143b5484e92ec8590cdb31d44";

  class TestCustomElement extends HTMLElement {
    foo = "bar";
  }

  beforeAll(() => {
    if (!customElements.get(customElementTagName)) {
      customElements.define(customElementTagName, TestCustomElement);
    }
  });

  it("should create an element builder for a known HTML element", async () => {
    const builder = jsx("div");
    const element = await build<HTMLDivElement>(builder);

    expect(element.tagName).toBe("DIV");
  });

  it("should create an element builder for a custom HTML element", async () => {
    const builder = jsx(customElementTagName);
    const element = await build<TestCustomElement>(builder);

    expect(element.tagName).toBe(customElementTagName.toUpperCase());
    expect(element.foo).toBe("bar");
  });

  it("should create an element builder with props", async () => {
    const builder = jsx("div", { id: "test-id", className: "test-class" });
    const element = await build<HTMLDivElement>(builder);

    expect(element.id).toBe("test-id");
    expect(element.className).toBe("test-class");
  });

  it("should create an element builder with children", async () => {
    const builder = jsx("div", {
      children: [jsx("span"), jsx("a")],
    });
    const element = await build<HTMLDivElement>(builder);

    expect(element.children.length).toBe(2);
    expect(element.children[0].tagName).toBe("SPAN");
    expect(element.children[1].tagName).toBe("A");
  });

  it("should create an element builder using a factory function", async () => {
    const factory = () => jsx("section");
    const builder = jsx(factory);
    const element = await build<HTMLElement>(builder);

    expect(element.tagName).toBe("SECTION");
  });

  it("should create an element builder using a factory function with props and children", async () => {
    const factory = () => jsx("article");
    const builder = jsx(factory, { id: "article-id", children: [jsx("p")] });
    const element = await build<HTMLElement>(builder);

    expect(element.tagName).toBe("ARTICLE");
    expect(element.id).toBe("article-id");
    expect(element.children.length).toBe(1);
    expect(element.children[0].tagName).toBe("P");
  });

  it("should create an element builder with a key prop", async () => {
    const builder = jsx("div", null, "unique-key");
    const element = await build<HTMLDivElement>(builder);

    expect(getElementDeclarationKey(element)).toBe("unique-key");
  });

  it("should create an element builder with a ref callback", async () => {
    let refElement: HTMLAnchorElement | null = null;

    const builder = jsx("a", {
      href: "https://example.com",
      ref: (element) => {
        expect<HTMLAnchorElement | null>(element);

        refElement = element;
      },
    });

    const element = await build<HTMLAnchorElement>(builder);

    expect(refElement === element).toBe(true);
  });

  describe("jsx syntax", () => {
    it("should create an element builder for a known HTML element using JSX", async () => {
      const ref = mock();

      const builder = (
        <>
          <div key="myKey" ref={ref} className="success">
            <a href="https://example.com">
              <span>Click me</span>
              <strong>now!</strong>
            </a>
          </div>
        </>
      ) as unknown as ElementBuilder.Fragment;

      const fragment = await build<DocumentFragment>(builder);

      expect(fragment instanceof DocumentFragment).toBe(true);
      expect(fragment.children.length).toBe(1);

      const div = fragment.children[0];

      expect(ref).toHaveBeenCalledWith(div);
      expect(getElementDeclarationKey(div)).toBe("myKey");
      expect(div.tagName).toBe("DIV");
      expect(div.className).toBe("success");

      expect(div.children.length).toBe(1);

      const anchor = div.children[0];

      expect(anchor.tagName).toBe("A");
      expect(anchor.getAttribute("href")).toBe("https://example.com");
      expect(anchor.children.length).toBe(2);

      const span = anchor.children[0];
      const strong = anchor.children[1];

      expect(span.tagName).toBe("SPAN");
      expect(span.textContent).toBe("Click me");
      expect(strong.tagName).toBe("STRONG");
      expect(strong.textContent).toBe("now!");
    });
  });
});
