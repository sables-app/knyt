import { expect, test } from "bun:test";

import { getElements, trackElements } from "../trackElements";

test.skipIf(
  // This environment variable prevents this test from running
  // unless explicitly enabled. This is because it's flaky when
  // run all together with other tests.
  //
  // This is simply the nature of trying to test against,
  // the garbage collector.
  import.meta.env.TEST_ELEMENT_TRACKING !== "true",
)("element tracking", async () => {
  class TestElement extends HTMLElement {}
  const tagName = `test-element-${crypto.randomUUID()}`;
  const trackedConstructor = trackElements(TestElement);

  customElements.define(tagName, trackedConstructor);

  // eslint-disable-next-line prefer-const
  let firstElement: HTMLElement | null = document.createElement(tagName);
  // eslint-disable-next-line prefer-const
  let secondElement = document.createElement(tagName);

  const elements = getElements(trackedConstructor);

  expect(elements).toHaveLength(2);
  expect(elements).toContain(firstElement);
  expect(elements).toContain(secondElement);

  // Force garbage collection of the first element
  {
    // Remove the strong reference to the first element
    firstElement = null;

    // Wait a tick to ensure the element is no longer reachable
    // This is necessary because running garbage collector synchronously
    // right after removing the strong reference doesn't work.
    await Promise.resolve();

    // Run garbage collector manually.
    Bun.gc();

    // Wait 100ms and for the automatic GC to kick in,
    // this is a lot slower, but is much more reliable.
    // await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const elementsAfterGC = getElements(trackedConstructor);

  expect(elementsAfterGC).toHaveLength(1);
  expect(elementsAfterGC).toContain(secondElement);
});
