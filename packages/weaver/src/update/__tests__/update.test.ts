/// <reference types="bun-types" />
/// <reference lib="dom" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import { Table } from "../../__tests__/Table";
import { build } from "../../build/mod";
import { dom, html } from "../../ElementBuilder";
import type { ElementBuilder, EventHandler } from "../../types/mod";
import { getElementDeclarationKey } from "../../utils/mod";
import { update } from "../update";

describe("update", async () => {
  it("should update the target element with the new element", async () => {
    const target = document.createElement("div");
    const element = dom.h1.$("Hello, World!");

    expect(target.innerHTML).toBe("");

    await update(target, element);

    expect(target.innerHTML).toBe("<h1>Hello, World!</h1>");
  });

  it("should update the target shadow root with the new element", async () => {
    const target = document.createElement("div");
    const shadowRoot = target.attachShadow({ mode: "open" });
    const element = dom.p.$("Lorem ipsum dolor sit amet");

    expect(shadowRoot.innerHTML).toBe("");

    await update(shadowRoot, element);

    expect(shadowRoot.innerHTML).toBe("<p>Lorem ipsum dolor sit amet</p>");
  });

  it("should update the target element with an empty element", async () => {
    const target = document.createElement("div");
    const element = dom.div;

    expect(target.innerHTML).toBe("");

    await update(target, element);

    expect(target.innerHTML).toBe("<div></div>");
  });

  it("should update the target element with multiple children", async () => {
    const target = document.createElement("div");
    const element = dom.ul.$(
      dom.li.$("Item 1"),
      dom.li.$("Item 2"),
      dom.li.$("Item 3"),
    );

    expect(target.innerHTML).toBe("");

    await update(target, element);

    expect(target.innerHTML).toBe(
      "<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
    );
  }, 100);

  it("should update the target element from a previous render", async () => {
    const target = document.createElement("div");
    const element = dom.h1.$("Hello, World!");

    expect(target.innerHTML).toBe("");

    await update(target, element);

    expect(target.innerHTML).toBe("<h1>Hello, World!</h1>");

    await update(target, dom.p.$("Lorem ipsum dolor sit amet"));

    expect(target.innerHTML).toBe("<p>Lorem ipsum dolor sit amet</p>");
  });

  it("should update the target element with new children", async () => {
    const target = await build(
      dom.div.$(
        dom.main.$(
          dom.div.$("Item 0"),
          dom.div.$("Item 1"),
          dom.div.$("Item 2"),
          dom.div.$("Item 3"),
        ),
      ),
    );

    expect(target.innerHTML).toBe(
      "<main><div>Item 0</div><div>Item 1</div><div>Item 2</div><div>Item 3</div></main>",
    );

    const itemsFromFirstRender = Array.from(target.querySelectorAll("div"));

    await update(
      target,
      dom.main.$(
        dom.section.$("Item 4"),
        dom.section.$("Item 5"),
        dom.section.$("Item 6"),
      ),
    );

    const itemsFromSecondRender = Array.from(
      target.querySelectorAll("section"),
    );

    expect(target.innerHTML).toBe(
      "<main><section>Item 4</section><section>Item 5</section><section>Item 6</section></main>",
    );

    expect(itemsFromFirstRender.length).toBe(4);
    expect(itemsFromSecondRender.length).toBe(3);

    for (let i = 0; i < itemsFromFirstRender.length; i++) {
      expect(itemsFromFirstRender[i] === itemsFromSecondRender[i]).toBe(false);
    }
  });

  it("should update the target element maintaining the previous children", async () => {
    const target = await build(
      dom.div.$(
        dom.ul.$(dom.li.$("Item 1"), dom.li.$("Item 2"), dom.li.$("Item 3")),
      ),
    );

    expect(target.innerHTML).toBe(
      "<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
    );

    const itemsFromFirstRender = Array.from(target.querySelectorAll("li"));

    await update(
      target,
      dom.ul.$(dom.li.$("Item 4"), dom.li.$("Item 5"), dom.li.$("Item 6")),
    );

    const itemsFromSecondRender = Array.from(target.querySelectorAll("li"));

    expect(target.innerHTML).toBe(
      "<ul><li>Item 4</li><li>Item 5</li><li>Item 6</li></ul>",
    );

    expect(itemsFromFirstRender.length).toBe(3);
    expect(itemsFromSecondRender.length).toBe(3);

    for (const item of itemsFromFirstRender) {
      expect(item).toHaveProperty("tagName", "LI");
    }
    for (const item of itemsFromSecondRender) {
      expect(item).toHaveProperty("tagName", "LI");
    }
    for (let i = 0; i < itemsFromFirstRender.length; i++) {
      expect(itemsFromFirstRender[i] === itemsFromSecondRender[i]).toBe(true);
    }
  });

  it("shouldn't maintain the previous children when an element is added before without keys", async () => {
    const target = document.createElement("div");
    const element = dom.ul.$(
      dom.li.$("Item 1"),
      dom.li.$("Item 2"),
      dom.li.$("Item 3"),
    );

    expect(target.innerHTML).toBe("");

    await update(target, element);

    const itemsFromFirstRender = Array.from(target.querySelectorAll("li"));

    expect(target.innerHTML).toBe(
      "<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
    );

    await update(
      target,
      dom.ul.$(
        dom.a.$("Hello World!"),
        dom.li.$("Item 4"),
        dom.li.$("Item 5"),
        dom.li.$("Item 6"),
      ),
    );

    const itemsFromSecondRender = Array.from(target.querySelectorAll("li"));

    expect(target.innerHTML).toBe(
      "<ul><a>Hello World!</a><li>Item 4</li><li>Item 5</li><li>Item 6</li></ul>",
    );

    expect(itemsFromFirstRender.at(0)).not.toBe(itemsFromSecondRender.at(1)!);
    expect(itemsFromFirstRender.at(1)).not.toBe(itemsFromSecondRender.at(2)!);
    expect(itemsFromFirstRender.at(2)).not.toBe(itemsFromSecondRender.at(3)!);
  });

  it("should maintain the previous children when an element is added before with keys", async () => {
    const target = await build(
      dom.div.$(
        dom.ul.$(
          dom.li.$key("item-1").$("Item 1"),
          dom.li.$key("item-2").$("Item 2"),
          dom.li.$key("item-3").$("Item 3"),
        ),
      ),
    );

    const itemsFromFirstRender = Array.from(target.childNodes[0].childNodes);

    expect(target.innerHTML).toBe(
      "<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
    );

    await update(
      target,
      dom.ul.$(
        dom.a.$("Hello World!"),
        dom.li.$key("item-1").$("Item 4"),
        dom.li.$key("item-2").$("Item 5"),
        dom.li.$key("item-3").$("Item 6"),
      ),
    );

    const itemsFromSecondRender = Array.from(target.childNodes[0].childNodes);

    expect(target.innerHTML).toBe(
      "<ul><a>Hello World!</a><li>Item 4</li><li>Item 5</li><li>Item 6</li></ul>",
    );

    expect(itemsFromFirstRender[0]).toHaveProperty("tagName", "LI");
    expect(itemsFromSecondRender[0]).toHaveProperty("tagName", "A");

    expect(itemsFromFirstRender).toHaveLength(3);
    expect(itemsFromSecondRender).toHaveLength(4);

    expect(itemsFromFirstRender[0] === itemsFromSecondRender[1]!).toBe(true);
    expect(itemsFromFirstRender[1] === itemsFromSecondRender[2]!).toBe(true);
    expect(itemsFromFirstRender[2] === itemsFromSecondRender[3]!).toBe(true);
  });

  it("should maintain the previous children when an element is added after with keys", async () => {
    const target = document.createElement("div");
    const element = dom.ul.$(
      dom.li.$key("item-1").$("Item 1"),
      dom.li.$key("item-2").$("Item 2"),
      dom.li.$key("item-3").$("Item 3"),
    );

    expect(target.innerHTML).toBe("");

    await update(target, element);

    const itemsFromFirstRender = Array.from(target.querySelectorAll("li"));

    expect(target.innerHTML).toBe(
      "<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
    );

    await update(
      target,
      dom.ul.$(
        dom.li.$key("item-1").$("Item 4"),
        dom.li.$key("item-2").$("Item 5"),
        dom.li.$key("item-3").$("Item 6"),
        dom.a.$("Hello World!"),
      ),
    );

    const itemsFromSecondRender = Array.from(target.querySelectorAll("li"));

    expect(target.innerHTML).toBe(
      "<ul><li>Item 4</li><li>Item 5</li><li>Item 6</li><a>Hello World!</a></ul>",
    );

    expect(itemsFromFirstRender.at(0) === itemsFromSecondRender.at(0)!).toBe(
      true,
    );
    expect(itemsFromFirstRender.at(1) === itemsFromSecondRender.at(1)!).toBe(
      true,
    );
    expect(itemsFromFirstRender.at(2) === itemsFromSecondRender.at(2)!).toBe(
      true,
    );
  });

  it("should maintain the previous children when an element is added after with attribute keys", async () => {
    const target = document.createElement("div");

    function createListItemWithAttributeKey(key: string, text: string) {
      const item = document.createElement("li");

      item.setAttribute("data-knytkey", key);
      item.textContent = text;

      return item;
    }

    const element = dom.ul.$(
      createListItemWithAttributeKey("item-1", "Item 1"),
      dom.li.$key("item-2").$("Item 2"),
      dom.li.$key("item-3").$("Item 3"),
    );

    expect(target.innerHTML).toBe("");

    await update(target, element);

    const itemsFromFirstRender = Array.from(target.querySelectorAll("li"));

    expect(target.innerHTML).toBe(
      // The key attribute should be preserved, because the element wasn't removed.
      '<ul><li data-knytkey="item-1">Item 1</li><li>Item 2</li><li>Item 3</li></ul>',
    );

    await update(
      target,
      dom.ul.$(
        dom.li.$key("item-1").$("Item 4"),
        dom.li.$key("item-2").$("Item 5"),
        dom.li.$key("item-3").$("Item 6"),
        dom.a.$("Hello World!"),
      ),
    );

    const itemsFromSecondRender = Array.from(target.querySelectorAll("li"));

    expect(target.innerHTML).toBe(
      '<ul><li data-knytkey="item-1">Item 4</li><li>Item 5</li><li>Item 6</li><a>Hello World!</a></ul>',
    );

    expect(itemsFromFirstRender.at(0) === itemsFromSecondRender.at(0)!).toBe(
      true,
    );
    expect(itemsFromFirstRender.at(1) === itemsFromSecondRender.at(1)!).toBe(
      true,
    );
    expect(itemsFromFirstRender.at(2) === itemsFromSecondRender.at(2)!).toBe(
      true,
    );
  });

  it("should update an element with innerHTML", async () => {
    const before = dom.section;
    const after = dom.section.innerHTML("<span>Inner HTML</span>");

    const target = await build(dom.div.$(before));

    expect(target.innerHTML).toBe("<section></section>");

    await update(target, after);

    expect(target.innerHTML).toBe("<section><span>Inner HTML</span></section>");
  });

  it("should update an element with innerText", async () => {
    const before = dom.section;
    const after = dom.section.innerText("Inner Text");

    const target = await build(dom.div.$(before));

    expect(target.innerHTML).toBe("<section></section>");

    await update(target, after);

    expect(target.innerHTML).toBe("<section>Inner Text</section>");
  });

  it("should update an element with a long list of keyed children where all but a few items are retained", async () => {
    const target = await build(
      dom.div.$(
        dom.ul.$(
          dom.li.$key("item-1").$("Item 1"),
          dom.li.$key("item-2").$("Item 2"),
          dom.li.$key("item-3").$("Item 3"),
          dom.li.$key("item-4").$("Item 4"),
          dom.li.$key("item-5").$("Item 5"),
          dom.li.$key("item-6").$("Item 6"),
          dom.li.$key("item-7").$("Item 7"),
          dom.li.$key("item-8").$("Item 8"),
          dom.li.$key("item-9").$("Item 9"),
          dom.li.$key("item-10").$("Item 10"),
        ),
      ),
    );

    const itemsFromFirstRender = Array.from(target.querySelectorAll("li"));

    expect(target.innerHTML).toBe(
      [
        "<ul>",
        "<li>Item 1</li>",
        "<li>Item 2</li>",
        "<li>Item 3</li>",
        "<li>Item 4</li>",
        "<li>Item 5</li>",
        "<li>Item 6</li>",
        "<li>Item 7</li>",
        "<li>Item 8</li>",
        "<li>Item 9</li>",
        "<li>Item 10</li>",
        "</ul>",
      ].join(""),
    );

    const nextDeclaration = dom.ul.$(
      dom.li.$key("item-4").$("Item 4"),
      dom.li.$key("item-6").$("Item 6"),
      dom.li.$key("item-3").$("Item 3"),
      dom.li.$key("item-8").$("Item 8"),
      dom.li.$key("item-11").$("Item 11"),
      dom.li.$key("item-12").$("Item 12"),
    );

    await update(target, nextDeclaration);

    const itemsFromSecondRender = Array.from(target.querySelectorAll("li"));

    expect(target.innerHTML).toBe(
      [
        "<ul>",
        "<li>Item 4</li>",
        "<li>Item 6</li>",
        "<li>Item 3</li>",
        "<li>Item 8</li>",
        "<li>Item 11</li>",
        "<li>Item 12</li>",
        "</ul>",
      ].join(""),
    );

    expect(itemsFromFirstRender.at(3) === itemsFromSecondRender.at(0)!).toBe(
      true,
    );
    expect(itemsFromFirstRender.at(5) === itemsFromSecondRender.at(1)!).toBe(
      true,
    );
    expect(itemsFromFirstRender.at(2) === itemsFromSecondRender.at(2)!).toBe(
      true,
    );
    expect(itemsFromFirstRender.at(7) === itemsFromSecondRender.at(3)!).toBe(
      true,
    );
    expect(itemsFromFirstRender.includes(itemsFromSecondRender.at(4)!)).toBe(
      false,
    );
    expect(itemsFromFirstRender.includes(itemsFromSecondRender.at(5)!)).toBe(
      false,
    );
  });

  it("should update an element and remove all children", async () => {
    const target = await build(
      dom.div.$(
        dom.ul.$(
          dom.li.$key("item-1").$("Item 1"),
          dom.li.$key("item-2").$("Item 2"),
          dom.li.$key("item-3").$("Item 3"),
        ),
      ),
    );

    expect(target.innerHTML).toBe(
      [
        "<ul>",
        "<li>Item 1</li>",
        "<li>Item 2</li>",
        "<li>Item 3</li>",
        "</ul>",
      ].join(""),
    );

    await update(target, dom.ul);

    expect(target.innerHTML).toBe("<ul></ul>");
  });

  it("should update an element and use the subsequent node check", async () => {
    const target = await build(
      dom.div.$(
        dom.ul.$(
          dom.li.$key("item-1").$("Item 1"),
          dom.li.$key("item-2").$("Item 2"),
          dom.li.$key("item-3").$("Item 3"),
          dom.li.$key("item-4").$("Item 4"),
          dom.li.$key("item-5").$("Item 5"),
          dom.li.$key("item-6").$("Item 6"),
        ),
      ),
    );

    expect(target.innerHTML).toBe(
      [
        "<ul>",
        "<li>Item 1</li>",
        "<li>Item 2</li>",
        "<li>Item 3</li>",
        "<li>Item 4</li>",
        "<li>Item 5</li>",
        "<li>Item 6</li>",
        "</ul>",
      ].join(""),
    );

    await update(
      target,
      dom.ul.$(
        dom.li.$key("item-1").$("Item 1"),
        dom.li.$key("item-3").$("Item 3"),
        dom.li.$key("item-4").$("Item 4"),
        dom.li.$key("item-6").$("Item 6"),
      ),
    );

    expect(target.innerHTML).toBe(
      [
        "<ul>",
        "<li>Item 1</li>",
        "<li>Item 3</li>",
        "<li>Item 4</li>",
        "<li>Item 6</li>",
        "</ul>",
      ].join(""),
    );
  });

  it("should update an element when items are swapped back and forth", async () => {
    const firstDeclaration = dom.ul.$(
      dom.li.$key("item-1").$("Item 1"),
      dom.li.$key("item-2").$("Item 2"),
      dom.li.$key("item-3").$("Item 3"),
      dom.li.$key("item-4").$("Item 4"),
      dom.li.$key("item-5").$("Item 5"),
    );

    const firstResult = [
      "<ul>",
      "<li>Item 1</li>",
      "<li>Item 2</li>",
      "<li>Item 3</li>",
      "<li>Item 4</li>",
      "<li>Item 5</li>",
      "</ul>",
    ].join("");

    const secondDeclaration = dom.ul.$(
      dom.li.$key("item-1").$("Item 1"),
      dom.li.$key("item-4").$("Item 4"),
      dom.li.$key("item-3").$("Item 3"),
      dom.li.$key("item-2").$("Item 2"),
      dom.li.$key("item-5").$("Item 5"),
    );

    const secondResult = [
      "<ul>",
      "<li>Item 1</li>",
      "<li>Item 4</li>",
      "<li>Item 3</li>",
      "<li>Item 2</li>",
      "<li>Item 5</li>",
      "</ul>",
    ].join("");

    const target = await build(dom.div.$(firstDeclaration));

    expect(target.innerHTML).toBe(firstResult);
    await update(target, secondDeclaration);

    expect(target.innerHTML).toBe(secondResult);

    await update(target, firstDeclaration);

    expect(target.innerHTML).toBe(firstResult);
  });

  it("should update an element with styles", async () => {
    const target = await build(
      dom.div.$(
        dom.ul.$(dom.li.$key("item-1").style({ color: "red" }).$("Item 1")),
      ),
    );

    expect(target.innerHTML).toBe(
      `<ul><li style="color: red;">Item 1</li></ul>`,
    );

    await update(
      target,
      dom.ul.$(dom.li.$key("item-1").style({ color: "blue" }).$("Item 1")),
    );

    expect(target.innerHTML).toBe(
      `<ul><li style="color: blue;">Item 1</li></ul>`,
    );
  });

  it("should update an element with attributes", async () => {
    const target = await build(
      dom.div.$(dom.ul.$(html.li.$key("item-1").id("foo").$("Item 1"))),
    );

    expect(target.innerHTML).toBe(`<ul><li id="foo">Item 1</li></ul>`);

    await update(
      target,
      dom.ul.$(html.li.$key("item-1").id("bar").$("Item 1")),
    );

    expect(target.innerHTML).toBe(`<ul><li id="bar">Item 1</li></ul>`);
  });

  it("should be able to update an element multiple times", async () => {
    const itemsByRender: Element[][] = [];

    const target = await build(
      dom.div.$(
        dom.main.$(
          dom.a.$key("item-1").$("Item 1"),
          dom.a.$key("item-2").$("Item 2"),
          dom.li.$key("item-3").$("Item 3"),
          dom.li.$key("item-4").$("Item 4"),
          dom.span.$key("item-5").$("Item 5"),
          dom.span.$key("item-6").$("Item 6"),
          dom.li.$key("item-7").$("Item 7"),
          dom.div.$key("item-8").$("Item 8"),
          dom.div.$key("item-9").$("Item 9"),
          dom.li.$key("item-10").$("Item 10"),
        ),
      ),
    );

    function getItems() {
      return Array.from(target.querySelectorAll("main > *"));
    }

    function recordItems() {
      itemsByRender.push(getItems());
    }

    recordItems();

    expect(target.innerHTML).toBe(
      [
        "<main>",
        "<a>Item 1</a>",
        "<a>Item 2</a>",
        "<li>Item 3</li>",
        "<li>Item 4</li>",
        "<span>Item 5</span>",
        "<span>Item 6</span>",
        "<li>Item 7</li>",
        "<div>Item 8</div>",
        "<div>Item 9</div>",
        "<li>Item 10</li>",
        "</main>",
      ].join(""),
    );

    const secondDeclaration = dom.main.$(
      dom.a.$key("item-4").$("Item 4"),
      dom.li.$key("item-6").$("Item 6"),
      dom.li.$key("item-3").$("Item 3"),
      dom.div.$key("item-8").$("Item 8"),
      dom.div.$key("item-11").$("Item 11"),
      dom.li.$key("item-12").$("Item 12"),
    );

    await update(target, secondDeclaration);

    recordItems();

    expect(itemsByRender[0][3] === itemsByRender[1][0]).toBe(false);
    expect(itemsByRender[0][5] === itemsByRender[1][1]).toBe(false);
    expect(itemsByRender[0][2] === itemsByRender[1][2]).toBe(true);
    expect(itemsByRender[0][7] === itemsByRender[1][3]).toBe(true);
    expect(itemsByRender[0].includes(itemsByRender[1][4])).toBe(false);
    expect(itemsByRender[0].includes(itemsByRender[1][5])).toBe(false);

    expect(target.innerHTML).toBe(
      [
        "<main>",
        "<a>Item 4</a>",
        "<li>Item 6</li>",
        "<li>Item 3</li>",
        "<div>Item 8</div>",
        "<div>Item 11</div>",
        "<li>Item 12</li>",
        "</main>",
      ].join(""),
    );

    const thirdDeclaration = dom.main.$(
      dom.a.$key("item-4").$(dom.span.$("Item 4")),
      dom.a.$key("item-5").$("Item 5"),
      dom.section.$key("item-44").$("Item 44"),
      dom.li.$key("item-6").$("Item 6"),
      dom.li.$key("item-7").$("Item 7"),
      dom.li.$key("item-9").$("Item 9"),
      dom.li.$key("item-3").$("Item 3"),
      dom.article.$key("item-12").$("Item 12"),
      dom.article.$key("item-33").$("Item 33"),
    );

    await update(target, thirdDeclaration);

    expect(target.innerHTML).toBe(
      [
        "<main>",
        "<a><span>Item 4</span></a>",
        "<a>Item 5</a>",
        "<section>Item 44</section>",
        "<li>Item 6</li>",
        "<li>Item 7</li>",
        "<li>Item 9</li>",
        "<li>Item 3</li>",
        "<article>Item 12</article>",
        "<article>Item 33</article>",
        "</main>",
      ].join(""),
    );

    recordItems();

    expect(itemsByRender[1][0] === itemsByRender[2][0]).toBe(true);
    expect(itemsByRender[1][2] === itemsByRender[2][6]).toBe(true);
    expect(itemsByRender[1][5] === itemsByRender[2][7]).toBe(false);
    expect(getElementDeclarationKey(itemsByRender[1][5])).toBe("item-12");
    expect(getElementDeclarationKey(itemsByRender[2][7])).toBe("item-12");
  });

  it("should maintain order when updating children with a child with an attribute key", async () => {
    function createElementWithAttributeKey(key: string, text: string) {
      const item = document.createElement("li");

      item.setAttribute("data-knytkey", key);
      item.textContent = text;

      return item;
    }

    function createHtmlWithAttributeKey(key: string, text: string) {
      const item = document.createElement("li");

      item.setAttribute("key", key);
      item.textContent = text;

      return html`<li data-knytkey=${key}>${text}</li>`;
    }

    const target = await build(
      dom.div.$(
        dom.ul.$(
          dom.li.$key("item-1").$("Item 1"),
          createElementWithAttributeKey("item-2", "Item 2"),
          dom.li.$key("item-3").$("Item 3"),
          createHtmlWithAttributeKey("item-4", "Item 4"),
          createHtmlWithAttributeKey("item-5", "Item 5"),
        ),
      ),
    );

    expect(target.innerHTML).toBe(
      [
        "<ul>",
        "<li>Item 1</li>",
        `<li data-knytkey="item-2">Item 2</li>`,
        "<li>Item 3</li>",
        `<li data-knytkey="item-4">Item 4</li>`,
        `<li data-knytkey="item-5">Item 5</li>`,
        "</ul>",
      ].join(""),
    );

    const itemsFromFirstRender = Array.from(target.querySelectorAll("li"));

    await update(
      target,
      dom.ul.$(
        // The element with the "item-5" key was moved to the beginning of the list
        dom.li.$key("item-5").$("Item 5"),
        dom.li.$key("item-6").$("Item 6"),
        // The element with the "item-2" key was moved towards the end of the list
        dom.li.$key("item-2").$("Item 2+"),
        dom.li.$key("item-7").$("Item 7"),
      ),
    );

    const itemsFromSecondRender = Array.from(target.querySelectorAll("li"));

    expect(target.innerHTML).toBe(
      [
        "<ul>",
        // The key attribute should be preserved, because the element wasn't removed.
        `<li data-knytkey="item-5">Item 5</li>`,
        // There should be no key attribute on the second child, because the element was removed.
        "<li>Item 6</li>",
        // The key attribute should be preserved, because the element wasn't removed.
        `<li data-knytkey="item-2">Item 2+</li>`,
        "<li>Item 7</li>",
        "</ul>",
      ].join(""),
    );

    // The second and fourth items should be new elements
    expect(itemsFromFirstRender.includes(itemsFromSecondRender[1])).toBe(false);
    expect(itemsFromFirstRender.includes(itemsFromSecondRender[3])).toBe(false);

    // The third item should be the same element as the second item from the first render
    expect(itemsFromFirstRender[1] === itemsFromSecondRender[2]).toBe(true);
    // The first item should be the same element as the fifth item from the first render
    expect(itemsFromFirstRender[4] === itemsFromSecondRender[0]).toBe(true);
  });

  describe("with listeners", async () => {
    const clickHandler = mock<EventHandler.Mouse<HTMLDivElement>>(() => {});

    beforeEach(() => {
      clickHandler.mockClear();
    });

    async function testListenerUpdate({
      firstRender,
      secondRender,
      eventTargetSelector,
      callCount,
    }: {
      firstRender: ElementBuilder;
      secondRender: ElementBuilder;
      eventTargetSelector: string;
      callCount: number;
    }) {
      const target = document.createElement("div");

      // Update the target with an element that doesn't have a listener
      await update(target, firstRender);
      // Ensure that the element was updated
      expect(target.querySelector(eventTargetSelector)).not.toBeNull();
      // Ensure that the click handler wasn't called yet
      expect(clickHandler).not.toHaveBeenCalled();
      // Dispatch a click event on the element
      target
        .querySelector(eventTargetSelector)!
        .dispatchEvent(new MouseEvent("click"));
      // Ensure that the click handler was not called,
      // because the element doesn't have a listener yet.
      expect(clickHandler).not.toHaveBeenCalled();
      // Update the target with an element that has a listener
      await update(target, secondRender);
      // Dispatch another click event on the element
      target
        .querySelector(eventTargetSelector)!
        .dispatchEvent(new MouseEvent("click"));
      // Ensure that the click handler was called,
      // because the element has a listener now.
      expect(clickHandler).toHaveBeenCalledTimes(callCount);
    }

    it("should update an element with a listener", async () => {
      await testListenerUpdate({
        firstRender: dom.div.id("test"),
        secondRender: dom.div.id("test").$on("click", clickHandler),
        eventTargetSelector: "#test",
        callCount: 1,
      });
    });

    it("should update an element with a listener", async () => {
      await testListenerUpdate({
        firstRender: html.div.id("test2"),
        secondRender: html.div.id("test2").$on("click", clickHandler),
        eventTargetSelector: "#test2",
        callCount: 1,
      });
    });

    it("should update an element with a listener using a listener declaration", async () => {
      await testListenerUpdate({
        firstRender: html.div.id("test3"),
        secondRender: html.div.id("test3").$on({
          type: "click",
          handler: clickHandler,
          options: {},
        }),
        eventTargetSelector: "#test3",
        callCount: 1,
      });
    });

    it("should update an element with multiple listeners using a listener declaration map", async () => {
      await testListenerUpdate({
        firstRender: html.div.id("test4"),
        secondRender: html.div.id("test4").$on({
          myFirstListener: {
            type: "click",
            handler: (event) => clickHandler(event),
          },
          mySecondListener: {
            type: "click",
            handler: (event) => clickHandler(event),
          },
        }),
        eventTargetSelector: "#test4",
        callCount: 2,
      });
    });
  });

  it("should update an element from a given ViewBuilder", async () => {
    const target = document.createElement("div");
    const element = Table().heading("Hello, World!").content("Lorem ipsum");

    expect(target.innerHTML).toBe("");

    await update(target, element);

    expect(target.innerHTML).toBe(
      '<table class="foo"><thead><tr><th>Hello, World!</th></tr></thead><tbody><tr><td>Lorem ipsum</td></tr></tbody></table>',
    );
  });

  it("should recognize empty strings as child nodes upon update", async () => {
    const target = document.createElement("div");
    const element = dom.div.$(
      dom.h1.$("Hello, World!"),
      dom.fragment.$("", dom.span.$("This is a span inside a fragment."), ""),
      dom.p.$("Lorem ipsum"),
    );

    const expectedHtml =
      "<div><h1>Hello, World!</h1><span>This is a span inside a fragment.</span><p>Lorem ipsum</p></div>";

    // The first call simply builds and inserts the elements as expected.
    await update(target, element);

    expect(target.innerHTML).toBe(expectedHtml);

    // The second call is the actual test:
    //
    // Empty strings were built properly built and inserted as text nodes in the first render,
    // but on update, a development-only assertions recognized them as falsy and threw an error.
    await update(target, element);

    expect(target.innerHTML).toBe(expectedHtml);
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

      it(`should update a element with a style attribute from style ${typeof style} with ${builderName} builder`, async () => {
        const target = document.createElement("div");
        const childElement = document.createElement("div");

        target.appendChild(childElement);

        childElement.style.color = "blue";
        childElement.style.background = "green";

        const element = builder.div.id("test").style(style).$("Hello, world!");

        await update(target, element);

        const result = target.firstChild as HTMLDivElement;

        expect(result.getAttribute("style")).toBe(
          "color: red; background: yellow;",
        );
      });
    });
  });

  describe("htmx support", () => {
    function inputDeclarationBefore(elementBuilder: ElementBuilder) {
      return elementBuilder
        .name("first-name")
        .$hx("on", "click", "alert('Hello, world!')")
        .$hx("swap", "outerHTML")
        .$hx("request", { timeout: 1000 })
        .$attrs({
          "hx-ws-connect": "ws://localhost:3000",
        });
    }

    function inputDeclarationAfter(elementBuilder: ElementBuilder) {
      return elementBuilder
        .name("last-name")
        .$hx("on", "mouseout", "qux()")
        .$hx("request", { timeout: 50 })
        .$attrs({
          "hx-ws-connect": "ws://localhost:1234",
        });
    }

    const expectedBeforeDom = `<input ${[
      `name="first-name"`,
      `hx-on:click="alert('Hello, world!')"`,
      `hx-swap="outerHTML"`,
      `hx-request="{&quot;timeout&quot;:1000}"`,
      `hx-ws-connect="ws://localhost:3000"`,
    ].join(" ")}>`;

    const expectedAfterDom = `<input ${[
      `name="last-name"`,
      `hx-request="{&quot;timeout&quot;:50}"`,
      `hx-ws-connect="ws://localhost:1234"`,
      `hx-on:mouseout="qux()"`,
    ].join(" ")}>`;

    const expectedBeforeMarkup = `<input ${[
      `name="first-name"`,
      `hx-ws-connect="ws://localhost:3000"`,
      `hx-on:click="alert('Hello, world!')"`,
      `hx-swap="outerHTML"`,
      `hx-request="{&quot;timeout&quot;:1000}"`,
    ].join(" ")}>`;

    const expectedAfterMarkup = `<input ${[
      `name="last-name"`,
      `hx-ws-connect="ws://localhost:1234"`,
      `hx-request="{&quot;timeout&quot;:50}"`,
      `hx-on:mouseout="qux()"`,
    ].join(" ")}>`;

    it("should update htmx attributes on DOM element builders", async () => {
      const target = await build(dom.div.$(inputDeclarationBefore(dom.input)));

      expect(target.innerHTML).toBe(expectedBeforeDom);

      await update(target, inputDeclarationAfter(dom.input));

      expect(target.innerHTML).toBe(expectedAfterDom);
    });

    it("should update htmx attributes on markup element builders", async () => {
      const target = await build(
        html.div.$(inputDeclarationBefore(html.input)),
      );

      expect(target.innerHTML).toBe(expectedBeforeMarkup);

      await update(target, inputDeclarationAfter(html.input));

      expect(target.innerHTML).toBe(expectedAfterMarkup);
    });
  });
});
