/// <reference types="bun-types" />
/// <reference lib="dom" />

import {
  build,
  dom,
  uponElementUpdatesSettled,
  type KnytContent,
} from "@knyt/weaver";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import { defineElement } from "../../define/defineElement";
import { defineProperty } from "../../define/defineProperty";
import { DeferredContent } from "../DeferredContent";

describe("DeferredContent", () => {
  const renderFn = mock(
    (foo: string | undefined, bar: number | undefined): KnytContent => {
      return `Resolved: ${foo}, ${bar}`;
    },
  );

  let outer: InstanceType<typeof Outer.Element>;

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
        renderFn,
      );
    },
  });

  beforeEach(async () => {
    outer = await build(Outer().foo(undefined).bar(undefined));
    document.body.appendChild(outer);
    renderFn.mockClear();
  });

  afterEach(() => {
    document.body.removeChild(outer);
  });

  it("should render resolved content when all promises resolve", async () => {
    const fooDeferred = Promise.withResolvers<string>();
    const barDeferred = Promise.withResolvers<number>();

    const deferredContent = outer.shadowRoot!.childNodes[0] as InstanceType<
      typeof DeferredContent.Element
    >;
    const inner = deferredContent.childNodes[0] as InstanceType<
      typeof Inner.Element
    >;

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

    await waitForSettled();

    {
      // Should render default content while no promises are set
      expect(deferredContent.shadowRoot?.innerHTML).toBe(
        `<div style="display: contents;"><slot name=""></slot></div><div hidden="" style="display: none;"></div>`,
      );
      // It should not have rendered any resolved content yet
      expect(inner.shadowRoot?.textContent).toBe(
        "Resolved: undefined, undefined",
      );
    }

    outer.foo = fooDeferred.promise;
    outer.bar = barDeferred.promise;

    await waitForSettled();

    {
      // Should render placeholder content while promises are unresolved
      expect(deferredContent.shadowRoot?.innerHTML).toBe(
        `<div style="display: none;" hidden=""><slot name=""></slot></div><div style="display: contents;"><slot name="placeholder"></slot></div>`,
      );
      // It should not have rendered any resolved content yet
      expect(inner.shadowRoot?.textContent).toBe(
        "Resolved: undefined, undefined",
      );
    }

    fooDeferred.resolve("Final Fantasy");

    await waitForSettled();

    {
      // Should render placeholder content while some promises are unresolved
      expect(deferredContent.shadowRoot?.innerHTML).toBe(
        `<div style="display: none;" hidden=""><slot name=""></slot></div><div style="display: contents;"><slot name="placeholder"></slot></div>`,
      );
      // It shouldn't have rendered with any values yet since not all promises are resolved
      expect(renderFn).not.toHaveBeenCalledWith("Final Fantasy", undefined);
      // It should not have rendered any resolved content yet
      expect(inner.shadowRoot?.textContent).toBe(
        "Resolved: undefined, undefined",
      );
    }

    barDeferred.resolve(7);

    await waitForSettled();

    {
      // Should render default content when all promises are resolved
      expect(deferredContent.shadowRoot?.innerHTML).toBe(
        `<div style="display: contents;"><slot name=""></slot></div><div style="display: none;" hidden=""></div>`,
      );
      // It should have rendered with all resolved values
      expect(renderFn).toHaveBeenCalledWith("Final Fantasy", 7);
      // It should have rendered the resolved content
      expect(inner.shadowRoot?.textContent).toBe("Resolved: Final Fantasy, 7");
    }
  });
});
