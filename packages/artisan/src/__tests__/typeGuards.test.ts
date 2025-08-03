/// <reference types="bun-types" />
/// <reference lib="dom" />

import { beforeAll, describe, expect, it } from "bun:test";

import {
  isComment,
  isCSSMediaRule,
  isCSSStyleDeclaration,
  isCSSStyleRule,
  isCSSStyleSheet,
  isCustomElement,
  isCustomElementConstructor,
  isDocument,
  isDocumentFragment,
  isElement,
  isElementWithNSSuffix,
  isHTMLElement,
  isNode,
  isNodeWithType,
  isNonNullableObject,
  isPromiseLike,
  isShadowRoot,
  isSVGElement,
  isTemplateStringsArray,
  isText,
  isUnknownDictionary,
} from "../typeGuards";

describe("typeGuards", () => {
  describe("isComment", () => {
    it("should return true for a Comment node", () => {
      const comment = document.createComment("test");

      expect(isComment(comment)).toBe(true);
    });

    it("should return false for non-Comment nodes", () => {
      const div = document.createElement("div");

      expect(isComment(div)).toBe(false);
    });
  });

  describe("isCSSMediaRule", () => {
    it("should return true for a CSSMediaRule", () => {
      const style = document.createElement("style");

      style.textContent = "@media screen { body { color: black; } }";
      document.head.appendChild(style);

      const mediaRule = style.sheet?.cssRules[0];

      expect(isCSSMediaRule(mediaRule)).toBe(true);

      document.head.removeChild(style);
    });

    it("should return false for non-CSSMediaRule objects", () => {
      const div = document.createElement("div");

      expect(isCSSMediaRule(div)).toBe(false);
    });

    it("should return false for non-media CSSRule objects", () => {
      const style = document.createElement("style");

      style.textContent = "body { color: black; }";
      document.head.appendChild(style);

      const cssRule = style.sheet?.cssRules[0];

      expect(isCSSMediaRule(cssRule)).toBe(false);

      document.head.removeChild(style);
    });
  });

  describe("isCSSStyleDeclaration", () => {
    it("should return true for a CSSStyleDeclaration", () => {
      const div = document.createElement("div");

      expect(isCSSStyleDeclaration(div.style)).toBe(true);
    });

    it("should return false for non-CSSStyleDeclaration objects", () => {
      const div = document.createElement("div");

      expect(isCSSStyleDeclaration(div)).toBe(false);
    });

    it("should return false for CSSStyleSheet objects", () => {
      const style = document.createElement("style");

      document.head.appendChild(style);

      const sheet = style.sheet;

      expect(isCSSStyleSheet(sheet)).toBe(true);
      expect(isCSSStyleDeclaration(sheet)).toBe(false);

      document.head.removeChild(style);
    });
  });

  describe("isCSSStyleRule", () => {
    it("should return true for a CSSStyleRule", () => {
      const style = document.createElement("style");
      style.textContent = "body { color: black; }";
      document.head.appendChild(style);
      const styleRule = style.sheet?.cssRules[0];

      expect(isCSSStyleRule(styleRule)).toBe(true);

      document.head.removeChild(style);
    });

    it("should return false for non-CSSStyleRule objects", () => {
      const div = document.createElement("div");

      expect(isCSSStyleRule(div)).toBe(false);
    });

    it("should return false for CSSMediaRule objects", () => {
      const style = document.createElement("style");
      style.textContent = "@media screen { body { color: black; } }";
      document.head.appendChild(style);
      const mediaRule = style.sheet?.cssRules[0];

      expect(isCSSStyleRule(mediaRule)).toBe(false);

      document.head.removeChild(style);
    });
  });

  describe("isCSSStyleSheet", () => {
    it("should return true for a CSSStyleSheet", () => {
      const style = document.createElement("style");
      document.head.appendChild(style);

      expect(isCSSStyleSheet(style.sheet)).toBe(true);

      document.head.removeChild(style);
    });

    it("should return false for non-CSSStyleSheet objects", () => {
      const div = document.createElement("div");

      expect(isCSSStyleSheet(div)).toBe(false);
    });

    it("should return false for CSSStyleDeclaration objects", () => {
      const div = document.createElement("div");

      expect(isCSSStyleDeclaration(div.style)).toBe(true);
      expect(isCSSStyleSheet(div.style)).toBe(false);
    });
  });

  describe("isDocumentFragment", () => {
    it("should return true for a DocumentFragment", () => {
      const fragment = document.createDocumentFragment();

      expect(isDocumentFragment(fragment)).toBe(true);
    });

    it("should return false for non-DocumentFragment objects", () => {
      const div = document.createElement("div");

      expect(isDocumentFragment(div)).toBe(false);
    });

    it("should return true for ShadowRoot", () => {
      const div = document.createElement("div");
      const shadowRoot = div.attachShadow({ mode: "open" });

      expect(isDocumentFragment(shadowRoot)).toBe(true);
    });
  });

  describe("isElement", () => {
    it("should return true for an Element", () => {
      const div = document.createElement("div");

      expect(isElement(div)).toBe(true);
    });

    it("should return false for non-Element objects", () => {
      const text = document.createTextNode("text");

      expect(isElement(text)).toBe(false);
    });

    it("should return false for non-Node objects", () => {
      const obj = {};

      expect(isElement(obj)).toBe(false);
    });

    it("should return false for DocumentFragment", () => {
      const fragment = document.createDocumentFragment();

      expect(isElement(fragment)).toBe(false);
    });

    it("should return false for ShadowRoot", () => {
      const div = document.createElement("div");
      const shadowRoot = div.attachShadow({ mode: "open" });

      expect(isElement(shadowRoot)).toBe(false);
    });
  });

  describe("isElementWithNSSuffix", () => {
    it("should return true for an Element with the specified namespace suffix", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const suffix = "svg";
      const result = isElementWithNSSuffix(svg, suffix);

      expect(result).toBe(true);
    });

    it("should return false for an Element without the specified namespace suffix", () => {
      const div = document.createElement("div");
      const suffix = "svg";
      const result = isElementWithNSSuffix(div, suffix);

      expect(result).toBe(false);
    });

    it("should return false for non-Element objects", () => {
      const text = document.createTextNode("text");
      const suffix = "svg";
      const result = isElementWithNSSuffix(text, suffix);

      expect(result).toBe(false);
    });
  });

  describe("isHTMLElement", () => {
    it("should return true for an HTMLElement", () => {
      const div = document.createElement("div");

      expect(isHTMLElement(div)).toBe(true);
    });

    it("should return false for non-HTMLElement objects", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

      expect(isHTMLElement(svg)).toBe(false);
    });
  });

  describe("isCustomElementConstructor", () => {
    it("should return false for the HTMLElement constructor", () => {
      expect(isCustomElementConstructor(HTMLElement)).toBe(false);
    });

    it("should return false for non-HTMLElement constructors", () => {
      expect(isCustomElementConstructor(Object)).toBe(false);
    });

    it("should return false for non-constructor objects", () => {
      const obj = {};

      expect(isCustomElementConstructor(obj)).toBe(false);
    });

    it("should return true for custom element constructors", () => {
      class CustomElement extends HTMLElement {
        constructor() {
          super();
        }

        myProperty = "value";
      }

      expect(isCustomElementConstructor(CustomElement)).toBe(true);
    });
  });

  describe("isNode", () => {
    it("should return true for a Node", () => {
      const div = document.createElement("div");

      expect(isNode(div)).toBe(true);
    });

    it("should return false for non-Node objects", () => {
      expect(isNode({})).toBe(false);
    });

    it("should return true for Element nodes", () => {
      const div = document.createElement("div");

      expect(isNode(div)).toBe(true);
    });
  });

  describe("isNodeWithType", () => {
    it("should return true for a Node with the specified type", () => {
      const text = document.createTextNode("text");

      expect(isNodeWithType(text, Node.TEXT_NODE)).toBe(true);
    });

    it("should return false for a Node with a different type", () => {
      const div = document.createElement("div");

      expect(isNodeWithType(div, Node.TEXT_NODE)).toBe(false);
    });
  });

  describe("isNonNullableObject", () => {
    it("should return true for non-null objects", () => {
      expect(isNonNullableObject({})).toBe(true);
    });

    it("should return false for null or non-object values", () => {
      expect(isNonNullableObject(null)).toBe(false);

      expect(isNonNullableObject(42)).toBe(false);
    });
  });

  describe("isPromiseLike", () => {
    it("should return true for Promise objects", () => {
      const promise = Promise.resolve();

      expect(isPromiseLike(promise)).toBe(true);
    });

    it("should return true for Promise-like objects", () => {
      const promiseLike = {
        then: (callback: () => void) => callback(),
      };

      expect(isPromiseLike(promiseLike)).toBe(true);
    });

    it("should return false for non-Promise-like objects", () => {
      const obj = {};

      expect(isPromiseLike(obj)).toBe(false);
    });

    it("should return false for non-object values", () => {
      expect(isPromiseLike(null)).toBe(false);

      expect(isPromiseLike(42)).toBe(false);
    });
  });

  describe("isShadowRoot", () => {
    it("should return true for a ShadowRoot", () => {
      const div = document.createElement("div");
      const shadowRoot = div.attachShadow({ mode: "open" });

      expect(isShadowRoot(shadowRoot)).toBe(true);
    });

    it("should return false for non-ShadowRoot objects", () => {
      const div = document.createElement("div");

      expect(isShadowRoot(div)).toBe(false);
    });

    it("should return false for DocumentFragment", () => {
      const fragment = document.createDocumentFragment();

      expect(isShadowRoot(fragment)).toBe(false);
    });
  });

  describe("isSVGElement", () => {
    it("should return true for an SVGElement", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

      expect(isSVGElement(svg)).toBe(true);
    });

    it("should return false for non-SVGElement objects", () => {
      const div = document.createElement("div");

      expect(isSVGElement(div)).toBe(false);
    });
  });

  describe("isTemplateStringsArray", () => {
    it("should return true for a TemplateStringsArray", () => {
      const value = ((strings: TemplateStringsArray) => strings)``;

      expect(isTemplateStringsArray(value)).toBe(true);
    });

    it("should return true for an array with a matching structure", () => {
      const value: TemplateStringsArray = Object.assign(["Hello, ", "world!"], {
        raw: ["Hello, ", "world!"],
      });

      expect(isTemplateStringsArray(value)).toBe(true);
    });

    it("should return false for plain arrays", () => {
      const value = ["Hello, ", "world!"];

      expect(isTemplateStringsArray(value)).toBe(false);
    });

    it("should return false for non-array objects", () => {
      const value = { 0: "Hello, ", 1: "world!" };

      expect(isTemplateStringsArray(value)).toBe(false);
    });
  });

  describe("isText", () => {
    it("should return true for a Text node", () => {
      const text = document.createTextNode("text");

      expect(isText(text)).toBe(true);
    });

    it("should return false for non-Text nodes", () => {
      const div = document.createElement("div");

      expect(isText(div)).toBe(false);
    });
  });

  describe("isUnknownDictionary", () => {
    it("should return true for an object with string keys and unknown values", () => {
      const obj: Record<string, unknown> = { key: "value" };

      expect(isUnknownDictionary(obj)).toBe(true);
    });

    it("should return false for non-object values", () => {
      expect(isUnknownDictionary(null)).toBe(false);

      expect(isUnknownDictionary(42)).toBe(false);
    });

    it("should return false for an array value", () => {
      expect(isUnknownDictionary([])).toBe(false);
    });
  });

  describe("isCustomElement", () => {
    beforeAll(() => {
      class HijkElement extends HTMLElement {
        constructor() {
          super();
        }
      }

      if (!customElements.get("hijk-element")) {
        customElements.define("hijk-element", HijkElement);
      }
    });

    it("should return true for a custom element", () => {
      const el = document.createElement("hijk-element");

      expect(isCustomElement(el)).toBe(true);
    });

    it("should return false for a non-custom element", () => {
      const el = document.createElement("div");

      expect(isCustomElement(el)).toBe(false);
    });
  });

  describe("isDocument", () => {
    it("should return true for a Document", () => {
      const doc = document;

      expect(isDocument(doc)).toBe(true);
    });

    it("should return false for non-Document objects", () => {
      const div = document.createElement("div");

      expect(isDocument(div)).toBe(false);
    });
  });
});
