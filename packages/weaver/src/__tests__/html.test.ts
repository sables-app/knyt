import { escapeHtml, isElement } from "@knyt/artisan";
import { describe, expect, it, mock } from "bun:test";

import { build } from "../build/mod.ts";
import { dom, html } from "../ElementBuilder.ts";
import { render } from "../render/mod.ts";
import { update } from "../update/mod.ts";
import { isElementDeclaration } from "../utils/mod.ts";

describe("html", async () => {
  describe("when used as a tagged template literal", async () => {
    it("builds elements", async () => {
      // prettier-ignore
      const declaration = html`<div class="container">Hello, World!</div>`;

      expect(isElementDeclaration.Fragment(declaration)).toBe(true);

      // `build` should always return a `DocumentFragment`
      // when the input is a `Fragment`, even if the fragment
      // contains a single element.
      const fragment = await build<DocumentFragment>(declaration);

      expect(fragment instanceof DocumentFragment).toBe(true);
      expect(fragment.childNodes.length).toBe(1);

      const div = fragment.children[0] as HTMLDivElement;

      expect(div.tagName).toBe("DIV");
      expect(div.className).toBe("container");
      expect(div.textContent).toBe("Hello, World!");
      expect(div.children.length).toBe(0);
      expect(div.attributes.length).toBe(1);
    });

    it("builds elements with interpolated values", async () => {
      const name = "World";
      const handleClick = mock();
      const buttonDeclaration = dom.button
        .onclick(handleClick)
        .$children(html.span.$("Click me!"));
      // prettier-ignore
      const declaration = html`<div class="container" ${{ role: "button" }}>Hello, ${name}!${buttonDeclaration}</div>`;

      expect(isElementDeclaration.Fragment(declaration)).toBe(true);

      // `build` should always return a `DocumentFragment`
      // when the input is a `Fragment`, even if the fragment
      // contains a single element.
      const fragment = await build<DocumentFragment>(declaration);

      expect(fragment instanceof DocumentFragment).toBe(true);
      expect(fragment.childNodes.length).toBe(1);

      const div = fragment.children[0] as HTMLDivElement;

      expect(div.tagName).toBe("DIV");
      expect(div.className).toBe("container");
      expect(div.getAttribute("role")).toBe("button");
      expect(div.textContent).toBe("Hello, World!Click me!");
      expect(div.children.length).toBe(1);
      expect(div.attributes.length).toBe(2);

      const button = div.children[0] as HTMLButtonElement;

      expect(button.tagName).toBe("BUTTON");
      expect(button.onclick).toBe(handleClick);
      expect(button.children.length).toBe(1);
      expect(button.attributes.length).toBe(0);

      const span = button.children[0] as HTMLSpanElement;

      expect(span.tagName).toBe("SPAN");
      expect(span.textContent).toBe("Click me!");
      expect(span.children.length).toBe(0);
      expect(span.attributes.length).toBe(0);
    });

    it("builds elements and escapes malicious content", async () => {
      const maliciousContent = `<script>alert('XSS');</script>`;
      // prettier-ignore
      const declaration = html`<div class="container">Hello, ${maliciousContent}!</div>`;

      const fragment = await build(declaration);

      expect(fragment.childNodes.length).toBe(1);

      const firstChild = fragment.childNodes[0] as HTMLDivElement;

      expect(isElement(firstChild)).toBe(true);
      expect(firstChild.tagName.toLowerCase()).toBe("div");
      expect(firstChild.className).toBe("container");

      // There should be only one child node in the div,
      // because the malicious content was not converted to HTML.
      // Instead, it should be treated as a text node.
      expect(firstChild.childNodes.length).toBe(1);

      const textNode = firstChild.childNodes[0] as Text;

      expect(textNode.nodeType).toBe(Node.TEXT_NODE);
      expect(textNode.textContent).toBe(`Hello, ${maliciousContent}!`);
    });

    it("renders HTML with interpolated values", async () => {
      const name = "World";
      const handleClick = mock();
      const buttonDeclaration = dom.button
        .onclick(handleClick)
        .$children(html.span.$("Click me!"));
      // prettier-ignore
      const declaration = html`<div class="container" ${{ role: "button" }}>Hello, ${name}!${buttonDeclaration}</div>`;

      expect(isElementDeclaration.Fragment(declaration)).toBe(true);

      // `render` should return a string representation of the HTML.
      const htmlString = await render(declaration);

      expect(htmlString).toBe(
        `<div class="container" role="button">Hello, World!<button><span>Click me!</span></button></div>`,
      );
    });

    it("renders HTML and escapes malicious content", async () => {
      const maliciousContent = `<script>alert('XSS');</script>`;
      // prettier-ignore
      const declaration = html`<div class="container">Hello, ${maliciousContent}!</div>`;
      const htmlString = await render(declaration);

      // The malicious content should be escaped in the rendered HTML.
      expect(htmlString).toBe(
        `<div class="container">Hello, ${escapeHtml(maliciousContent)}!</div>`,
      );
    });

    it("updates elements and escapes malicious content", async () => {
      const maliciousContent = `<script>alert('XSS');</script>`;
      // prettier-ignore
      const declaration = html`<div class="container">Hello, ${maliciousContent}!</div>`;

      const root = document.createElement("div");
      root.appendChild(document.createElement("div"));
      await update(root, declaration);

      expect(root.childNodes.length).toBe(1);

      const firstChild = root.childNodes[0] as HTMLDivElement;

      expect(isElement(firstChild)).toBe(true);
      expect(firstChild.tagName.toLowerCase()).toBe("div");
      expect(firstChild.className).toBe("container");

      // There should be only one child node in the div,
      // because the malicious content was not converted to HTML.
      // Instead, it should be treated as a text node.
      expect(firstChild.childNodes.length).toBe(1);

      const textNode = firstChild.childNodes[0] as Text;

      expect(textNode.nodeType).toBe(Node.TEXT_NODE);
      expect(textNode.textContent).toBe(`Hello, ${maliciousContent}!`);
    });
  });
});
