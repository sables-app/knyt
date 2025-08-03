/// <reference types="bun-types" />
/// <reference lib="dom" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import { Table } from "../../__tests__/Table";
import { KEY_ATTRIBUTE } from "../../constants";
import { dom, html, svg } from "../../ElementBuilder";
import type { EventHandler, TypedEvent } from "../../types/mod";
import { build } from "../build";

describe("build", async () => {
  it("should build a simple div element with text content", async () => {
    const input = dom.div.$children("Hello, World!");
    const expected = document.createElement("div");

    expected.innerHTML = "Hello, World!";

    const result = await build(input);

    expect(result).toBeInstanceOf(HTMLDivElement);
    expect(result).toHaveProperty("outerHTML", expected.outerHTML);
  });

  it("should build a nested element structure", async () => {
    const input = dom.div.$children(
      dom.span.$children("Nested"),
      dom.p.$children("Structure"),
    );
    const expected = document.createElement("div");
    const span = document.createElement("span");
    const p = document.createElement("p");

    span.innerHTML = "Nested";
    p.innerHTML = "Structure";

    expected.appendChild(span);
    expected.appendChild(p);

    const result = await build(input);

    expect(result).toBeInstanceOf(HTMLDivElement);
    expect(result).toHaveProperty("outerHTML", expected.outerHTML);
  });

  it("should build an element with properties", async () => {
    const input = dom.div
      .id("test-id")
      .className("test-class")
      .$children("With properties");
    const expected = document.createElement("div");

    expected.id = "test-id";
    expected.className = "test-class";
    expected.innerHTML = "With properties";

    const result = await build(input);

    expect(result).toBeInstanceOf(HTMLDivElement);
    expect(result).toHaveProperty("outerHTML", expected.outerHTML);
  });

  it("should build an element with styles", async () => {
    const input = dom.div
      .$props({ style: { color: "red", fontSize: "16px" } })
      .$children("Styled Element");
    const expected = document.createElement("div");

    expected.style.color = "red";
    expected.style.fontSize = "16px";
    expected.innerHTML = "Styled Element";

    const result = await build(input);

    expect(result).toBeInstanceOf(HTMLDivElement);
    expect(result).toHaveProperty("outerHTML", expected.outerHTML);
  });

  it("shouldn't build an element with a key attribute by default", async () => {
    const input = dom.div.$key("test-key").$children("Hello");
    const expected = document.createElement("div");

    expected.innerHTML = "Hello";

    const result = await build(input);

    expect(result).toBeInstanceOf(HTMLDivElement);
    expect(result).toHaveProperty("outerHTML", expected.outerHTML);
  });

  describe("with disableKeyAttributes option set to `false`", () => {
    it("should build an element with a key attribute", async () => {
      const input = dom.div.$key("test-key").$children("Hello");
      const expected = document.createElement("div");

      expected.setAttribute(KEY_ATTRIBUTE, "test-key");
      expected.innerHTML = "Hello";

      const result = await build(input, {
        disableKeyAttributes: false,
      });

      expect(result).toBeInstanceOf(HTMLDivElement);
      expect(result).toHaveProperty("outerHTML", expected.outerHTML);
    });
  });

  it("should build a fragment with multiple elements", async () => {
    const input = dom.fragment.$children(
      dom.div.$children("First Element"),
      dom.span.$children("Second Element"),
    );
    const expected = document.createDocumentFragment();
    const div = document.createElement("div");
    const span = document.createElement("span");

    div.innerHTML = "First Element";
    span.innerHTML = "Second Element";

    expected.appendChild(div);
    expected.appendChild(span);

    const result = await build(input);

    expect(result).toBeInstanceOf(DocumentFragment);
    expect(result?.childNodes.length).toBe(2);
    expect(result?.childNodes[0]).toHaveProperty("outerHTML", div.outerHTML);
    expect(result?.childNodes[1]).toHaveProperty("outerHTML", span.outerHTML);
  });

  it("should build an element with innerHTML", async () => {
    const input = dom.div.innerHTML("<span>Inner HTML</span>");
    const expected = document.createElement("div");

    expected.innerHTML = "<span>Inner HTML</span>";

    const result = await build(input);

    expect(result).toBeInstanceOf(HTMLDivElement);
    expect(result).toHaveProperty("outerHTML", expected.outerHTML);
  });

  it("should build SVG markup", async () => {
    const input = svg.svg
      .$attrs({ width: "100", height: "100" })
      .$children(svg.circle.$attrs({ cx: "50", cy: "50", r: "40" }));

    const expected = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );

    expected.setAttribute("width", "100");
    expected.setAttribute("height", "100");

    circle.setAttribute("cx", "50");
    circle.setAttribute("cy", "50");
    circle.setAttribute("r", "40");

    expected.appendChild(circle);

    const result = await build<SVGSVGElement>(input);

    expect(result).toBeInstanceOf(SVGSVGElement);
    expect(result.outerHTML).toBe(expected.outerHTML);
  });

  it("should build an element with innerText", async () => {
    const input = dom.div.innerText("Inner Text");
    const expected = document.createElement("div");

    expected.innerText = "Inner Text";

    const result = await build(input);

    expect(result).toBeInstanceOf(HTMLDivElement);
    expect(result).toHaveProperty("outerHTML", expected.outerHTML);
  });

  describe("with listeners", async () => {
    const clickHandler = mock<EventHandler.Mouse<HTMLDivElement>>((event) => {
      // Assert that the `EventHandler.Mouse` type is accurate
      expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
      expect(event).toBeInstanceOf(MouseEvent);
    });

    beforeEach(() => {
      clickHandler.mockClear();
    });

    it("should build an element with a listener", async () => {
      const input = dom.div
        .$on("click", (event) => {
          // Assert that the `$on` method is typed correctly
          expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
          clickHandler(event);
        })
        // Ensure that the element builder can be used after adding a listener
        .$children("With Listener");

      const expected = document.createElement("div");

      expected.innerHTML = "With Listener";

      const result = await build(input);

      expect(result).toBeInstanceOf(HTMLDivElement);
      expect(result).toHaveProperty("outerHTML", expected.outerHTML);

      expect(clickHandler).not.toHaveBeenCalled();
      result!.dispatchEvent(new MouseEvent("click"));
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it("should build an element with a listener using a listener declaration", async () => {
      const input = dom.div
        .$on({
          type: "click",
          handler: clickHandler,
          options: {},
        })
        // Ensure that the element builder can be used after adding a listener
        .$children("With Listener");

      const expected = document.createElement("div");

      expected.innerHTML = "With Listener";

      const result = await build(input);

      expect(result).toBeInstanceOf(HTMLDivElement);
      expect(result).toHaveProperty("outerHTML", expected.outerHTML);

      expect(clickHandler).not.toHaveBeenCalled();
      result!.dispatchEvent(new MouseEvent("click"));
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it("should build an element with multiple listeners using a listener declaration map", async () => {
      const input = dom.div
        .$on({
          myFirstListener: {
            type: "click",
            handler: (event) => clickHandler(event),
          },
          mySecondListener: {
            type: "click",
            handler: (event) => clickHandler(event),
          },
        })
        // Ensure that the element builder can be used after adding a listener
        .$children("With Listener");

      const expected = document.createElement("div");

      expected.innerHTML = "With Listener";

      const result = await build(input);

      expect(result).toBeInstanceOf(HTMLDivElement);
      expect(result).toHaveProperty("outerHTML", expected.outerHTML);

      expect(clickHandler).not.toHaveBeenCalled();
      result!.dispatchEvent(new MouseEvent("click"));
      expect(clickHandler).toHaveBeenCalledTimes(2);
    });
  });

  it("should build an element from a given ViewBuilder", async () => {
    const input = Table().heading("Hello, World!").content("Lorem ipsum");
    const expected = document.createElement("table");

    expected.className = "foo";
    expected.innerHTML =
      "<thead><tr><th>Hello, World!</th></tr></thead><tbody><tr><td>Lorem ipsum</td></tr></tbody>";

    const result = await build(input);

    // ViewBuilder instances are always built to a DocumentFragment
    expect(result).toBeInstanceOf(DocumentFragment);
    expect(result?.childNodes.length).toBe(1);
    expect(result?.childNodes[0]).toHaveProperty(
      "outerHTML",
      expected.outerHTML,
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

      it(`should build a element with a style attribute from style ${typeof style} with ${builderName} builder`, async () => {
        const element = builder.div.id("test").style(style).$("Hello, world!");

        const result = await build(element);

        expect(result.getAttribute("style")).toBe(
          "color: red; background: yellow;",
        );
      });
    });
  });

  describe("htmx support", () => {
    it("should build htmx attributes on DOM element builders", async () => {
      const result = await build<HTMLInputElement>(
        dom.input
          .$hx("select", "#info-detail")
          .$hx("on", "click", "alert('Hello, world!')")
          .$hx("on", ":afterrequest", "myCallback()")
          .$hx("swap", "outerHTML")
          .$hx("request", { timeout: 1000 })
          .$hx("vals", { foo: "bar" })
          .$attrs({
            "hx-ws-connect": "ws://localhost:3000",
          }),
      );

      const expected = `<input ${[
        `hx-select="#info-detail"`,
        `hx-on:click="alert('Hello, world!')"`,
        `hx-on::afterrequest="myCallback()"`,
        `hx-swap="outerHTML"`,
        `hx-request="{&quot;timeout&quot;:1000}"`,
        `hx-vals="{&quot;foo&quot;:&quot;bar&quot;}"`,
        `hx-ws-connect="ws://localhost:3000"`,
      ].join(" ")}>`;

      expect(result.outerHTML).toBe(expected);
    });

    it("should build htmx attributes on markup element builders", async () => {
      const result = await build<HTMLInputElement>(
        html.input
          .$hx("select", "#info-detail")
          .$hx("on", "click", "alert('Hello, world!')")
          .$hx("on", ":afterrequest", "myCallback()")
          .$hx("swap", "outerHTML")
          .$hx("request", { timeout: 1000 })
          .$hx("vals", { foo: "bar" })
          .$attrs({
            "hx-ws-connect": "ws://localhost:3000",
          }),
      );

      const expected = `<input ${[
        `hx-ws-connect="ws://localhost:3000"`,
        `hx-select="#info-detail"`,
        `hx-on:click="alert('Hello, world!')"`,
        `hx-on::afterrequest="myCallback()"`,
        `hx-swap="outerHTML"`,
        `hx-request="{&quot;timeout&quot;:1000}"`,
        `hx-vals="{&quot;foo&quot;:&quot;bar&quot;}"`,
      ].join(" ")}>`;

      expect(result.outerHTML).toBe(expected);
    });
  });

  describe("$cx method", () => {
    it("should add class names to DOM builders", async () => {
      const result = await build(
        dom.div.$cx("foo", "bar", { baz: true, qux: false }),
      );

      const expected = `<div class="foo bar baz"></div>`;

      expect(result.outerHTML).toBe(expected);
    });

    it("should add class names to markup builders", async () => {
      const result = await build(
        html.div.$cx("foo", "bar", { baz: true, qux: false }),
      );

      const expected = `<div class="foo bar baz"></div>`;

      expect(result.outerHTML).toBe(expected);
    });
  });
});
