/// <reference types="bun-types" />
/// <reference lib="dom" />

import { ref } from "@knyt/artisan";
import { build, uponElementUpdatesSettled } from "@knyt/weaver";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import { defineElement } from "../../define/defineElement.ts";
import type { KnytElement } from "../../KnytElement.ts";
import { defer, DeferredContentRenderer } from "../defer.ts";

describe("defer", () => {
  const TestHost = defineElement("defer-test-host", {
    lifecycle() {},
  });

  async function createHost() {
    return build(TestHost());
  }

  function countDeferredContentRenderers(host: KnytElement) {
    return host
      ._getReactiveControllers()
      .filter((c) => c instanceof DeferredContentRenderer).length;
  }

  it("should create a `DeferredContentRenderer` for references", async () => {
    const host = await createHost();
    const r1 = ref(Promise.resolve(1));
    const r2 = ref(Promise.resolve(2));
    const renderer = defer(host, r1, r2);

    expect(renderer).toBeInstanceOf(DeferredContentRenderer);
  });

  it("adds a `DeferredContentRenderer` for a promise", async () => {
    const host = await createHost();
    const { promise } = Promise.withResolvers<number>();

    expect(countDeferredContentRenderers(host)).toBe(0);

    defer(host, promise);

    expect(countDeferredContentRenderers(host)).toBe(1);
  });

  it("removes the `DeferredContentRenderer` when the promise resolves", async () => {
    const host = await createHost();
    const { promise, resolve } = Promise.withResolvers<number>();

    defer(host, promise);

    expect(countDeferredContentRenderers(host)).toBe(1);

    resolve(42);
    await promise;

    expect(countDeferredContentRenderers(host)).toBe(0);
  });

  describe("thenRender", () => {
    let host: KnytElement;

    beforeEach(async () => {
      host = await createHost();
    });

    afterEach(() => {
      document.body.removeChild(host);
    });

    it("should render content with resolved values after all promises resolve", async () => {
      const r1 = ref(Promise.resolve("foo"));
      const r2 = ref(Promise.resolve("bar"));
      const renderer = defer(host, r1, r2);
      const renderFn = mock((a, b) => `${a}-${b}`);
      const render = renderer.thenRender(renderFn);

      document.body.appendChild(host);

      // should return `null` if data is not ready
      expect(await render()).toBe(null);

      await uponElementUpdatesSettled(host, 0);

      // should return the rendered content when data is ready
      expect(await render()).toBe("foo-bar");

      // should call the given render function with resolved values
      expect(renderFn).toHaveBeenCalledWith("foo", "bar");
    });
  });

  // For some reason Bun immediately fails the whole test suite
  // an rejected promise is created, even though it's handled.
  // Skipping this test for now.
  describe.todo("error handling", () => {});
});
