/// <reference types="bun-types" />
/// <reference lib="dom" />

import { createReference } from "@knyt/artisan";
import type { TypedEvent } from "@knyt/html-type";
import { describe, it } from "bun:test";

import { EventListenerController } from "../EventListenerController.ts";
import type { ReactiveControllerHost } from "../ReactiveController.ts";

class TestEvent123 extends Event {
  foo = "bar";

  constructor() {
    super("test-event-123");
  }
}

class TestElement123 extends HTMLElement {
  hello = "world";
}

declare global {
  interface HTMLElementEventMap {
    "test-event-123": TestEvent123;
  }

  interface HTMLElementTagNameMap {
    "test-element-123": TestElement123;
  }
}

describe("EventListenerController", () => {
  const host = {
    addController: () => {},
  } as unknown as ReactiveControllerHost;
  describe("type", () => {
    it("is compatible with a HTMLElement", () => {
      new EventListenerController<"click", HTMLDivElement>(host, {
        eventName: "click",
        listener(event: TypedEvent<HTMLDivElement, MouseEvent>) {},
        target$: createReference(document.createElement("div")),
      });
    });

    it("is compatible with a SVGElement", () => {
      new EventListenerController<"click", SVGPathElement>(host, {
        eventName: "click",
        listener(event: TypedEvent<SVGPathElement, MouseEvent>) {},
        target$: createReference(
          document.createElementNS("http://www.w3.org/2000/svg", "path"),
        ),
      });
    });

    it("is compatible with a custom event", () => {
      new EventListenerController<"test-event-123", TestElement123>(host, {
        eventName: "test-event-123",
        listener(event: TypedEvent<TestElement123, TestEvent123>) {},
        target$: createReference(document.createElement("test-element-123")),
      });
    });
  });
});
