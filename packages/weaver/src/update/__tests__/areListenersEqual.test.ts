/// <reference types="bun-types" />
/// <reference lib="dom" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import { areListenersEqual } from "../areListenersEqual";

describe("areListenersEqual", async () => {
  it("returns true when both listeners are the same reference", () => {
    const listener = {
      type: "click",
      handler: () => {},
      options: { once: true },
    };

    expect(areListenersEqual(listener, listener)).toBe(true);
  });

  it("returns false when one listener is undefined", () => {
    const listener = {
      type: "click",
      handler: () => {},
      options: { once: true },
    };

    expect(areListenersEqual(listener, undefined)).toBe(false);
    expect(areListenersEqual(undefined, listener)).toBe(false);
  });

  it("returns true when both listeners are undefined", () => {
    expect(areListenersEqual(undefined, undefined)).toBe(true);
  });

  it("returns false when type is not equal", () => {
    const prevListener = {
      type: "click",
      handler: () => {},
      options: { once: true },
    };
    const nextListener = {
      type: "mouseover",
      handler: prevListener.handler,
      options: prevListener.options,
    };

    expect(areListenersEqual(prevListener, nextListener)).toBe(false);
  });

  it("returns false when handler is not equal", () => {
    const prevListener = {
      type: "click",
      handler: () => {},
      options: { once: true },
    };
    const nextListener = {
      type: prevListener.type,
      handler: () => {},
      options: prevListener.options,
    };

    expect(areListenersEqual(prevListener, nextListener)).toBe(false);
  });

  it("returns false when options are not shallowly equal", () => {
    const prevListener = {
      type: "click",
      handler: () => {},
      options: { once: true },
    };
    const nextListener = {
      type: prevListener.type,
      handler: prevListener.handler,
      options: { once: false },
    };

    expect(areListenersEqual(prevListener, nextListener)).toBe(false);
  });

  it("returns true when type, handler, and options are equal", () => {
    const handler = () => {};
    const options = { once: true };
    const prevListener = {
      type: "click",
      handler,
      options,
    };
    const nextListener = {
      type: prevListener.type,
      handler: prevListener.handler,
      options: { ...prevListener.options },
    };

    expect(areListenersEqual(prevListener, nextListener)).toBe(true);
  });
});
