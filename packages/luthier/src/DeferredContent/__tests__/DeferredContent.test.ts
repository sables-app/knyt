/// <reference types="bun-types" />
/// <reference lib="dom" />

import { build, dom, uponElementUpdatesSettled } from "@knyt/weaver";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { defineElement } from "../../define/defineElement.ts";
import { defineProperty } from "../../define/defineProperty.ts";
import { DeferredContent } from "../DeferredContent.ts";

describe.skipIf(
  // This environment variable prevents this test from running
  // unless explicitly enabled. This is because it's flaky when
  // run all together with other tests.
  //
  // It seems to be related to some kind of timing issue,
  // possibly related to Bun's test runner.
  //
  // It works fine when run alone, or when only a part
  // of the test suite is run.
  //
  // I've run the tests by themselves using `--rerun-each=50`
  // and they pass every time, so I'm confident the tests
  // are cleaning up after themselves properly.
  //
  // TODO: Figure out why this is necessary
  import.meta.env.TEST_DEFERRED_CONTENT !== "true",
)("DeferredContent", () => {
  const Outer = defineElement("deferred-content-test-outer", {
    properties: {
      foo: defineProperty<Promise<string>>(),
      bar: defineProperty<Promise<number>>(),
    },
    lifecycle() {
      return () => {
        return DeferredContent().$children(
          Inner().foo(this.foo).bar(this.bar),
          dom.div
            .slot(DeferredContent.Slot.Placeholder)
            .$("placeholder message"),
        );
      };
    },
  });

  const Inner = defineElement("deferred-content-test-inner", {
    properties: {
      foo: defineProperty<Promise<string>>(),
      bar: defineProperty<Promise<number>>(),
    },
    lifecycle() {
      return this.defer(this.refProp("foo"), this.refProp("bar")).thenRender(
        (foo, bar) => `Resolved: ${foo}, ${bar}`,
      );
    },
  });

  let outer: InstanceType<typeof Outer.Element>;
  let deferredContent: InstanceType<typeof DeferredContent.Element>;
  let inner: InstanceType<typeof Inner.Element>;

  /**
   * Waits for updates to settle on all involved elements.
   * Not every element is guaranteed to have updates, but
   * this ensures that if they do, we wait for them.
   */
  async function waitForSettled() {
    await uponElementUpdatesSettled(outer, 100);
    await uponElementUpdatesSettled(deferredContent, 100);
    await uponElementUpdatesSettled(inner, 100);
  }

  beforeEach(async () => {
    outer = await build(Outer().foo(undefined).bar(undefined));

    document.body.appendChild(outer);

    await uponElementUpdatesSettled(outer, 100);

    deferredContent = outer.shadowRoot?.childNodes[0] as InstanceType<
      typeof DeferredContent.Element
    >;
    inner = deferredContent?.childNodes[0] as InstanceType<
      typeof Inner.Element
    >;
  });

  afterEach(() => {
    document.body.removeChild(outer);
  });

  it("should have rendered the outer element", () => {
    expect(outer.tagName.toLowerCase()).toBe(Outer.tagName);
    expect(document.body.contains(outer)).toBe(true);
  });

  it("should have rendered the deferred content element", () => {
    expect(deferredContent.tagName.toLowerCase()).toBe(DeferredContent.tagName);
    expect(outer.shadowRoot?.contains(deferredContent)).toBe(true);
  });

  it("should have rendered the inner element", () => {
    expect(inner.tagName.toLowerCase()).toBe(Inner.tagName);
    expect(outer.shadowRoot?.contains(inner)).toBe(true);
  });

  describe("with no promises set", () => {
    it("should render default content while no promises are set", async () => {
      const shadowRoot = deferredContent.shadowRoot!;
      const children = shadowRoot.children;

      // Assert there are two divs
      expect(children.length).toBe(2);

      // First div: default content (should be visible)
      const defaultDiv = children[0] as HTMLDivElement;
      expect(defaultDiv.style.display).toBe("contents");
      expect(defaultDiv.hasAttribute("hidden")).toBe(false);
      expect(defaultDiv.querySelector("slot")?.getAttribute("name")).toBe("");

      // Second div: placeholder (should be hidden)
      const placeholderDiv = children[1] as HTMLDivElement;
      expect(placeholderDiv.style.display).toBe("none");
      expect(placeholderDiv.hasAttribute("hidden")).toBe(true);
    });

    it("should not have rendered any resolved content yet", async () => {
      expect(inner.shadowRoot?.textContent).toBe(
        "Resolved: undefined, undefined",
      );
    });
  });

  describe("with promises set", () => {
    let fooDeferred: ReturnType<typeof Promise.withResolvers<string>>;
    let barDeferred: ReturnType<typeof Promise.withResolvers<number>>;

    beforeEach(async () => {
      fooDeferred = Promise.withResolvers<string>();
      barDeferred = Promise.withResolvers<number>();

      outer.foo = fooDeferred.promise;
      outer.bar = barDeferred.promise;

      await waitForSettled();
    });

    it("should render placeholder content while promises are unresolved", async () => {
      const shadowRoot = deferredContent.shadowRoot!;
      const children = shadowRoot.children;

      // Assert there are two divs
      expect(children.length).toBe(2);

      // First div: default content (should be hidden)
      const defaultDiv = children[0] as HTMLDivElement;
      expect(defaultDiv.style.display).toBe("none");
      expect(defaultDiv.hasAttribute("hidden")).toBe(true);
      expect(defaultDiv.querySelector("slot")?.getAttribute("name")).toBe("");

      // Second div: placeholder (should be visible)
      const placeholderDiv = children[1] as HTMLDivElement;
      expect(placeholderDiv.style.display).toBe("contents");
      expect(placeholderDiv.hasAttribute("hidden")).toBe(false);
      expect(placeholderDiv.querySelector("slot")?.getAttribute("name")).toBe(
        "placeholder",
      );
    });

    it("should not have rendered any resolved content yet", async () => {
      expect(inner.shadowRoot?.textContent).toBe(
        "Resolved: undefined, undefined",
      );
    });

    describe("after resolving one promise", () => {
      beforeEach(async () => {
        fooDeferred.resolve("Final Fantasy");

        await waitForSettled();
      });

      it(`Should render placeholder content while some promises are unresolved`, async () => {
        const shadowRoot = deferredContent.shadowRoot!;
        const children = shadowRoot.children;

        // Assert there are two divs
        expect(children.length).toBe(2);

        // First div: default content (should be hidden)
        const defaultDiv = children[0] as HTMLDivElement;
        expect(defaultDiv.style.display).toBe("none");
        expect(defaultDiv.hasAttribute("hidden")).toBe(true);
        expect(defaultDiv.querySelector("slot")?.getAttribute("name")).toBe("");

        // Second div: placeholder (should be visible)
        const placeholderDiv = children[1] as HTMLDivElement;
        expect(placeholderDiv.style.display).toBe("contents");
        expect(placeholderDiv.hasAttribute("hidden")).toBe(false);
        expect(placeholderDiv.querySelector("slot")?.getAttribute("name")).toBe(
          "placeholder",
        );
      });

      it(`It should not have rendered any resolved content yet`, async () => {
        expect(inner.shadowRoot?.textContent).toBe(
          "Resolved: undefined, undefined",
        );
      });

      describe("after resolving all promises", () => {
        beforeEach(async () => {
          barDeferred.resolve(7);

          await waitForSettled();
        });

        it("should render default content when all promises are resolved", async () => {
          const shadowRoot = deferredContent.shadowRoot!;
          const children = shadowRoot.children;

          // Assert there are two divs
          expect(children.length).toBe(2);

          // First div: default content (should be visible)
          const defaultDiv = children[0] as HTMLDivElement;
          expect(defaultDiv.style.display).toBe("contents");
          expect(defaultDiv.hasAttribute("hidden")).toBe(false);
          expect(defaultDiv.querySelector("slot")?.getAttribute("name")).toBe(
            "",
          );

          // Second div: placeholder (should be hidden)
          const placeholderDiv = children[1] as HTMLDivElement;
          expect(placeholderDiv.style.display).toBe("none");
          expect(placeholderDiv.hasAttribute("hidden")).toBe(true);
        });

        it("should have rendered the resolved content", async () => {
          expect(inner.shadowRoot?.textContent).toBe(
            "Resolved: Final Fantasy, 7",
          );
        });
      });
    });
  });
});
