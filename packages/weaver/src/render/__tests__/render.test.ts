/// <reference types="bun-types" />
/// <reference lib="dom" />

import { beforeAll, describe, expect, it } from "bun:test";

import { Table } from "../../__tests__/Table";
import { dom, html, svg } from "../../ElementBuilder";
import { render } from "../render";
import { defineDeferredElement } from "./DeferredElement";

describe("render", async () => {
  it("should render a simple string", async () => {
    const result = await render("Hello, world!");

    expect(result).toBe("Hello, world!");
  });

  it("should return an empty string for null", async () => {
    const result = await render(null);

    expect(result).toBe("");
  });

  it("should return an empty string for false", async () => {
    const result = await render(false);

    expect(result).toBe("");
  });

  it("should render an element with attributes and children", async () => {
    const element = html.div.id("test").$("Hello, world!");
    const result = await render(element);

    expect(result).toBe('<div id="test">Hello, world!</div>');
  });

  it("should render an element with multiple children", async () => {
    const element = html.div.$("Hello,", " world!");
    const result = await render(element);

    expect(result).toBe("<div>Hello, world!</div>");
  });

  it("should render an element with boolean attributes", async () => {
    const element = html.input.type("checkbox").checked(true);
    const result = await render(element);

    expect(result).toBe('<input type="checkbox" checked>');
  });

  it("should render nested elements", async () => {
    const element = html.div.$(html.span.$("Hello,"), html.span.$(" world!"));
    const result = await render(element);

    expect(result).toBe("<div><span>Hello,</span><span> world!</span></div>");
  });

  it("should render an element with number children", async () => {
    const element = html.div.$(123);
    const result = await render(element);

    expect(result).toBe("<div>123</div>");
  });

  it("should render an element with mixed children", async () => {
    const element = html.div.$("Hello,", 123, html.span.$(" world!"));
    const result = await render(element);

    expect(result).toBe("<div>Hello,123<span> world!</span></div>");
  });

  it("should render an element with a fragment child", async () => {
    const element = html.div.$(html.fragment.$("Hello, world!"));
    const result = await render(element);

    expect(result).toBe("<div>Hello, world!</div>");
  });

  it("should render an element with a fragment child and other children", async () => {
    const element = html.div.$(html.fragment.$("Hello,"), " world!");
    const result = await render(element);

    expect(result).toBe("<div>Hello, world!</div>");
  });

  it("should render an element with a fragment child and attributes", async () => {
    const element = html.div.id("test").$(html.fragment.$("Hello, world!"));
    const result = await render(element);

    expect(result).toBe('<div id="test">Hello, world!</div>');
  });

  it("should render SVG", async () => {
    const element = svg.svg
      .width("100")
      .height("100")
      .viewBox("0 0 100 100")
      .$(
        svg.circle
          .cx("50")
          .cy("50")
          .r("40")
          .stroke("black")
          .$attrs({ "stroke-width": "3" })
          .fill("red"),
      );
    const result = await render(element);

    expect(result).toBe(
      '<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"></circle></svg>',
    );
  });

  it("should render elements with whitespace", async () => {
    const element = html.div
      .$("Hello, world!", html.span.$("We have bagels."))
      .id("welcome-message");
    const result = await render(element, { enableWhitespace: true });

    expect(result).toBe(
      `<div\n id="welcome-message"\n>\nHello, world!\n<span>\nWe have bagels.\n</span>\n</div>`,
    );
  });

  it("should render elements with keys", async () => {
    const element = html.div.$key("test").$("Hello, world!");
    const result = await render(element);

    expect(result).toBe('<div data-knytkey="test">Hello, world!</div>');
  });

  it("should render elements with keys inside a DOM fragment", async () => {
    const element = dom.fragment.$(html.div.$key("test").$("Hello, world!"));
    const result = await render(element);

    expect(result).toBe('<div data-knytkey="test">Hello, world!</div>');
  });

  it("should render elements with keys disabled", async () => {
    const element = html.div.$key("test").$("Hello, world!");
    const result = await render(element, { disableKeyAttributes: true });

    expect(result).toBe("<div>Hello, world!</div>");
  });

  it("should render elements from a given ViewBuilder", async () => {
    const result = await render(
      Table().heading("Hello, World!").content("Lorem ipsum"),
    );

    expect(result).toBe(
      '<table class="foo"><thead><tr><th>Hello, World!</th></tr></thead><tbody><tr><td>Lorem ipsum</td></tr></tbody></table>',
    );
  });

  describe("with `style` prop", () => {
    [
      {
        builder: dom,
        style: "color: red; background: yellow;",
      },
      {
        builder: html,
        style: "color: red; background: yellow;",
      },
      {
        builder: dom,
        style: { color: "red", background: "yellow" },
      },
      {
        builder: html,
        style: { color: "red", background: "yellow" },
      },
    ].forEach(({ builder, style }) => {
      const builderName = builder === html ? "html" : "dom";

      it(`should render an tag with a style attribute from style ${typeof style} with ${builderName} builder`, async () => {
        const element = builder.div.id("test").style(style).$("Hello, world!");

        const result = await render(element);

        expect(result).toBe(
          '<div id="test" style="color: red; background: yellow;">Hello, world!</div>',
        );
      });
    });
  });

  describe("with existing DOM elements", () => {
    it("should render an existing DOM element", async () => {
      const element = document.createElement("div");

      element.id = "test";
      element.textContent = "Hello, world!";

      const result = await render(html.fragment.$(element));

      expect(result).toBe('<div id="test">Hello, world!</div>');
    });

    it("should render an existing custom element with complex attributes", async () => {
      class ComplexTestElement extends HTMLElement {
        static observedAttributes = ["foo", "bar"];

        constructor() {
          super();

          this.setAttribute("foo", "baz");
          this.setAttribute("bar", "qux");
        }
      }

      customElements.define("complex-test-element", ComplexTestElement);

      const element = document.createElement("complex-test-element");

      element.textContent = "Hello, world!";

      element.setAttribute("data-test", "123");
      element.setAttribute("aria-label", "Complex Test");
      // Empty string attribute values should be preserved
      element.setAttribute("hidden", "");
      element.setAttribute("tabindex", "0");
      element.setAttribute("title", "A complex custom element");
      element.setAttribute("role", "button");
      element.setAttribute("draggable", "true");
      element.setAttribute("contenteditable", "true");
      element.setAttribute("spellcheck", "false");
      // Boolean attributes are recognized,
      // but will be rendered as empty strings
      element.toggleAttribute("autofocus", true);
      element.setAttribute("style", "color: red; background: yellow;");
      element.setAttribute("lang", "fr");
      element.setAttribute("dir", "rtl");
      element.setAttribute("accesskey", "k");
      element.setAttribute("data-extra", "extra-value");

      const result = await render(html.fragment.$(element));

      expect(result).toBe(
        `<complex-test-element foo="baz" bar="qux" data-test="123" aria-label="Complex Test" hidden="" tabindex="0" title="A complex custom element" role="button" draggable="true" contenteditable="true" spellcheck="false" autofocus="" style="color: red; background: yellow;" lang="fr" dir="rtl" accesskey="k" data-extra="extra-value">Hello, world!</complex-test-element>`,
      );
    });

    it("should render an existing element with an open shadow root", async () => {
      const div = document.createElement("div");

      div.id = "shadow-test";

      const shadowRoot = div.attachShadow({ mode: "open" });

      shadowRoot.innerHTML = "<p>Hello from the shadow root!</p>";

      div.innerHTML = "<button type='button'>Click me</button>";

      const result = await render(div);

      expect(result).toBe(
        [
          `<div id="shadow-test">`,
          `<template shadowrootmode="open">`,
          `<p>Hello from the shadow root!</p>`,
          `</template>`,
          `<button type="button">Click me</button>`,
          `</div>`,
        ].join(""),
      );
    });

    it("should render an existing element with a closed shadow root", async () => {
      const div = document.createElement("div");

      div.id = "shadow-test-closed";

      const shadowRoot = div.attachShadow({ mode: "closed" });

      shadowRoot.innerHTML = "<p>Hello from the closed shadow root!</p>";

      div.innerHTML = "<button type='button'>Click me</button>";

      const result = await render(div);

      expect(result).toBe(
        [
          `<div id="shadow-test-closed">`,
          // Closed shadow roots are not rendered in the output
          // To render a closed shadow root, `renderToString` must be implemented on the element
          `<button type="button">Click me</button>`,
          `</div>`,
        ].join(""),
      );
    });
  });

  describe("with `reactiveElementTimeout` enabled", () => {
    beforeAll(() => {
      defineDeferredElement();
    });

    function waitFor(duration: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, duration));
    }

    it("should wait for reactive elements to complete one update", async () => {
      const builder = dom["test-deferred-element"].strategy([1, 50]);
      const resultPromise = render(builder, { reactiveElementTimeout: 100 });

      let isRenderFinished = false;

      resultPromise.then(() => {
        isRenderFinished = true;
      });

      // Should not finish synchronously
      expect(isRenderFinished).toBe(false);

      await Promise.resolve();

      // Should not finish after one microtask
      expect(isRenderFinished).toBe(false);

      await waitFor(25);

      // Should not finish after 25ms
      expect(isRenderFinished).toBe(false);

      await waitFor(25);

      // Should finish after 50ms
      expect(isRenderFinished).toBe(true);

      // Catch any errors that might occur
      await resultPromise;
    });

    it("should wait for reactive elements to complete multiple updates", async () => {
      const builder = dom["test-deferred-element"].strategy([3, 15]);
      const resultPromise = render(builder, { reactiveElementTimeout: 100 });

      let isRenderFinished = false;

      resultPromise.then(() => {
        isRenderFinished = true;
      });

      // Should not finish synchronously
      expect(isRenderFinished).toBe(false);

      // Wait an exact number of microtasks for the first render
      // The wait should be a deterministic number of microtasks.
      {
        // It being exactly 5 for this case is a coincidence.
        const NUM_OF_MICROTASKS = 5;

        for (let i = 0; i < NUM_OF_MICROTASKS; i++) {
          await Promise.resolve();
        }
      }

      // Should not finish after the first render
      expect(isRenderFinished).toBe(false);

      await waitFor(15);

      // Should not finish after the first update
      expect(isRenderFinished).toBe(false);

      await waitFor(15);

      // Should not finish after the second update
      expect(isRenderFinished).toBe(false);

      await waitFor(15);

      // Should finish after the third update
      expect(isRenderFinished).toBe(true);

      // Catch any errors that might occur
      await resultPromise;
    });

    it("should respect the reactiveElementTimeout option", async () => {
      const builder = dom["test-deferred-element"].strategy([1, 1000]);
      const resultPromise = render(builder, {
        reactiveElementTimeout: 50,
      });

      let isRenderFinished = false;

      resultPromise.catch(() => {
        isRenderFinished = true;
      });

      await waitFor(49);

      // Should not timeout early
      expect(isRenderFinished).toBe(false);

      await waitFor(1);

      // Should finish after the timeout
      expect(isRenderFinished).toBe(true);

      try {
        await resultPromise;

        throw new Error("Expected the promise to be rejected");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toHaveProperty(
          "message",
          expect.stringContaining(
            "Timeout waiting for element to finish updates. Timeout: 50ms",
          ),
        );
      }
    });

    it("should allow for microtask updates to complete when the timeout is set to 0", async () => {
      const builder = dom["test-deferred-element"].strategy([0, 0]);
      const resultPromise = render(builder, { reactiveElementTimeout: 0 });

      let isRenderFinished = false;

      resultPromise.then(() => {
        isRenderFinished = true;
      });

      // Should not finish synchronously
      expect(isRenderFinished).toBe(false);

      // If should not timeout, because the updates
      // should complete within the current millisecond
      await resultPromise;

      expect(isRenderFinished).toBe(true);
    });
  });

  describe("htmx support", () => {
    it("should render htmx attributes on DOM element builders", async () => {
      const result = await render(
        dom.input
          .$hx("select", "#info-detail")
          .$hx("on", "click", "alert('Hello, world!')")
          .$hx("on", ":after-request", "myCallback()")
          .$hx("swap", "outerHTML")
          .$hx("request", { timeout: 1000 })
          .$hx("vals", { foo: "bar" })
          .$attrs({
            "hx-ws-connect": "ws://localhost:3000",
          }),
      );

      const expected = `<input hx-select="#info-detail" hx-on:click="alert('Hello, world!')" hx-on::after-request="myCallback()" hx-swap="outerHTML" hx-request="{&quot;timeout&quot;:1000}" hx-vals="{&quot;foo&quot;:&quot;bar&quot;}" hx-ws-connect="ws://localhost:3000">`;

      expect(result).toBe(expected);
    });

    it("should render htmx attributes on markup element builders", async () => {
      const result = await render(
        html.input
          .$hx("select", "#info-detail")
          .$hx("on", "click", "alert('Hello, world!')")
          .$hx("on", ":after-request", "myCallback()")
          .$hx("swap", "outerHTML")
          .$hx("request", { timeout: 1000 })
          .$hx("vals", { foo: "bar" })
          .$attrs({
            "hx-ws-connect": "ws://localhost:3000",
          }),
      );

      expect(result.trim()).toBe(
        `<input hx-ws-connect="ws://localhost:3000" hx-select="#info-detail" hx-on:click="alert('Hello, world!')" hx-on::after-request="myCallback()" hx-swap="outerHTML" hx-request="{&quot;timeout&quot;:1000}" hx-vals="{&quot;foo&quot;:&quot;bar&quot;}">`,
      );
    });
  });

  describe("withDocType", () => {
    it("should render an entire document", async () => {
      const element = html.html
        .lang("en")
        .class("dark")
        .$attrs({ "data-dark": "true" })
        .$children(
          html.head.$children(
            html.title.$children("Test Document"),
            html.meta.charset("UTF-8"),
            html.script.src("script.js"),
            html.link.rel("stylesheet").href("styles.css"),
            html.style.$innerHTML("body { background-color: #f0f0f0; }"),
            html.base.href("https://example.com/"),
          ),
          html.body.$children(
            html.h1.$children("Hello, world!"),
            html.p.$children("This is a test document."),
          ),
        );

      const result = await render.withDocType(element);

      expect(result).toBe(
        '<!doctype html><html lang="en" class="dark" data-dark="true"><head><title>Test Document</title><meta charset="UTF-8"><script src="script.js"></script><link rel="stylesheet" href="styles.css"><style>body { background-color: #f0f0f0; }</style><base href="https://example.com/"></head><body><h1>Hello, world!</h1><p>This is a test document.</p></body></html>',
      );
    });
  });

  describe("$cx method", () => {
    it("should add class names to DOM builders", async () => {
      const result = await render(
        dom.div.$cx("foo", "bar", { baz: true, qux: false }),
      );

      const expected = `<div class="foo bar baz"></div>`;

      expect(result).toBe(expected);
    });

    it("should add class names to markup builders", async () => {
      const result = await render(
        html.div.$cx("foo", "bar", { baz: true, qux: false }),
      );

      const expected = `<div class="foo bar baz"></div>`;

      expect(result).toBe(expected);
    });
  });
});
