/// <reference types="bun-types" />
/// <reference lib="dom" />

import { beforeAll, describe, expect, it } from "bun:test";

import {
  ElementDeclarationKind,
  ElementDeclarationSymbol,
  FragmentTypeSymbol,
} from "../../constants";
import type { ElementDeclaration } from "../../types/mod";
import { createElementFromDeclaration } from "../createElementFromDeclaration";

describe("createElementFromDeclaration", () => {
  describe("when given a DomHTML declaration", () => {
    const declaration: ElementDeclaration.DomHTML<
      Partial<HTMLDivElement>,
      HTMLDivElement
    > = {
      [ElementDeclarationSymbol]: true,
      type: "div",
      kind: ElementDeclarationKind.DomHTML,
      props: {
        className: "test-class",
      },
      children: [],
      ref: undefined,
      key: undefined,
      listeners: undefined,
      renderMode: undefined,
      attributes: undefined,
    };

    it("creates a DOM element", () => {
      const result = createElementFromDeclaration(document, declaration);

      expect(result).toBeInstanceOf(HTMLDivElement);
    });

    it("does not set properties on the element", () => {
      const result = createElementFromDeclaration(document, declaration);

      expect(result.className).toBe("");
    });
  });

  describe("when given a DomSVG declaration", () => {
    const declaration: ElementDeclaration.DomSVG<
      Partial<SVGElement>,
      SVGElement
    > = {
      [ElementDeclarationSymbol]: true,
      type: "circle",
      kind: ElementDeclarationKind.DomSVG,
      props: {
        dataset: {
          foo: "bar",
        },
      },
      children: [],
      ref: undefined,
      key: undefined,
      listeners: undefined,
      renderMode: undefined,
      attributes: undefined,
    };

    it("creates a DOM element", () => {
      const result = createElementFromDeclaration(document, declaration);

      // `happy-dom` doesn't completely support SVG elements,
      // so we can't use `CIRCLE` here.
      expect(result.tagName).toBe("circle");
      // `happy-dom` doesn't completely support SVG elements,
      // so we can't use `SVGCircleElement` here.
      expect(result).toBeInstanceOf(SVGElement);
    });
  });

  describe("when given a custom element declaration", () => {
    const testTagName = `knyt-${crypto.randomUUID()}`;
    class TestElement extends HTMLElement {}

    beforeAll(() => {
      if (!globalThis.customElements.get(testTagName)) {
        globalThis.customElements.define(testTagName, TestElement);
      }
    });

    const declaration: ElementDeclaration.DomHTML<
      Partial<HTMLDivElement>,
      HTMLDivElement
    > = {
      [ElementDeclarationSymbol]: true,
      type: testTagName as any,
      kind: ElementDeclarationKind.DomHTML,
      props: {},
      children: [],
      ref: undefined,
      key: undefined,
      listeners: undefined,
      renderMode: undefined,
      attributes: undefined,
    };

    it("creates an instance of the custom element", () => {
      const result = createElementFromDeclaration(document, declaration);

      expect(result.tagName.toLowerCase()).toBe(testTagName);
      expect(result instanceof HTMLAnchorElement).not.toBe(true);
    });
  });

  it("when given a fragment declaration, throws an error", () => {
    const declaration: ElementDeclaration.Fragment = {
      [ElementDeclarationSymbol]: true,
      type: FragmentTypeSymbol,
      kind: ElementDeclarationKind.DomHTML,
      props: {},
      children: [],
      ref: undefined,
      key: undefined,
      listeners: undefined,
      renderMode: undefined,
      attributes: undefined,
    };

    expect(() => createElementFromDeclaration(document, declaration)).toThrow(
      Error,
    );
  });

  it("when given an invalid declaration, throws an error", () => {
    const declaration: ElementDeclaration.Input = {
      [ElementDeclarationSymbol]: true,
      type: "div",
      kind: "invalid" as any,
      props: {},
      children: [],
      ref: undefined,
      key: undefined,
      listeners: undefined,
      renderMode: undefined,
      attributes: undefined,
    };

    expect(() => createElementFromDeclaration(document, declaration)).toThrow(
      Error,
    );
  });

  describe("when given a MarkupHTML declaration", () => {
    const declaration: ElementDeclaration.MarkupHTML = {
      [ElementDeclarationSymbol]: true,
      type: "div",
      kind: ElementDeclarationKind.MarkupHTML,
      props: {},
      children: [],
      ref: undefined,
      key: undefined,
      listeners: undefined,
      renderMode: undefined,
      attributes: undefined,
    };

    it("creates a DOM element", () => {
      const result = createElementFromDeclaration(document, declaration);

      expect(result).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("when given a MarkupSVG declaration", () => {
    const declaration: ElementDeclaration.MarkupSVG = {
      [ElementDeclarationSymbol]: true,
      type: "circle",
      kind: ElementDeclarationKind.MarkupSVG,
      props: {},
      children: [],
      ref: undefined,
      key: undefined,
      listeners: undefined,
      renderMode: undefined,
      attributes: undefined,
    };

    it("creates a DOM element", () => {
      const result = createElementFromDeclaration(document, declaration);

      // `happy-dom` doesn't completely support SVG elements,
      // so we can't use `CIRCLE` here.
      expect(result.tagName).toBe("circle");
      // `happy-dom` doesn't completely support SVG elements,
      // so we can't use `SVGCircleElement` here.
      expect(result).toBeInstanceOf(SVGElement);
    });
  });
});
