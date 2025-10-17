import { css } from "@knyt/tailor";
import {
  __hostAdapter,
  __lifecycle,
  type LifecycleDelegate,
  type ReactiveController,
} from "@knyt/tasker";
import { __resourceRenderers, html, render } from "@knyt/weaver";
import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

import {
  __knytElementComposedLifecycle,
  __knytElementComposedRenderer,
} from "../constants.ts";
import { defineElementDefinition } from "../define/defineElementDefinition.ts";
import { defineKnytElement } from "../define/defineKnytElement.ts";
import { defineProperty } from "../define/defineProperty.ts";
import {
  __postConstruct,
  __styleSheetAdoption,
  type KnytElement,
} from "../KnytElement.ts";
import { type KnytElementComposed } from "../KnytElementComposed.ts";
import { performHotUpdate } from "../performHotUpdate.ts";
import type { ElementDefinition } from "../types.ts";

describe("performHotUpdate", () => {
  type TestElement = KnytElement & { oldProp?: number; newProp?: string };

  let OldButtonTracked: ElementDefinition<KnytElementComposed.Constructor, any>;
  let NewButtonTracked: ElementDefinition<KnytElementComposed.Constructor, any>;
  let OldButtonTrackedElement: KnytElementComposed.Constructor;
  let NewButtonTrackedElement: KnytElementComposed.Constructor;
  let oldButtonController: ReactiveController;
  let newButtonController: ReactiveController;
  let oldButtonDelegate: LifecycleDelegate<any>;
  let newButtonDelegate: LifecycleDelegate<any>;

  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  beforeEach(() => {
    console.warn = mock();
    console.info = mock();
  });

  afterAll(() => {
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
  });

  beforeEach(() => {
    // Four different tag names are used to avoid the
    // "custom element already defined" error. Normally,
    // both constructors would share a tag name, and the
    // custom elements registry would be stubbed to allow
    // redefinition.
    //
    // For this test, we focus only on constructor update
    // logic and skip the complexity of stubbing the custom
    // elements registry.
    //
    // `performHotUpdate` only uses the tag name for logging
    // purposes, so it does not affect the test's validity.

    // ---

    oldButtonController = {
      hostConnected: mock(),
      hostDisconnected: mock(),
    };

    newButtonController = {
      hostConnected: mock(),
      hostDisconnected: mock(),
    };

    oldButtonDelegate = {
      hostMounted: mock(),
      hostUnmounted: mock(),
    };

    newButtonDelegate = {
      hostMounted: mock(),
      hostUnmounted: mock(),
    };

    const OldButton = defineKnytElement({
      tagName: `knyt-${crypto.randomUUID()}`,
      properties: {
        oldProp: defineProperty().number(),
      },
      styleSheet: css`
        button {
          color: red;
        }
      `,
      lifecycle() {
        this.oldProp = 123;

        this.addDelegate(oldButtonDelegate);
        this.addController(oldButtonController);
        this.addRenderer({
          hostRender() {
            return html`<span>Old Renderer</span>`;
          },
        });

        return () => html.button.$("Old Button");
      },
    }) as any;

    const NewButton = defineKnytElement({
      tagName: `knyt-${crypto.randomUUID()}`,
      properties: {
        newProp: defineProperty().string(),
      },
      styleSheet: css`
        button {
          color: blue;
        }
      `,
      lifecycle() {
        this.newProp = "abc";

        this.addDelegate(newButtonDelegate);
        this.addController(newButtonController);
        this.addRenderer({
          hostRender() {
            return html`<section>New Renderer</section>`;
          },
        });

        return () => html.button.$("New Button");
      },
    }) as any;

    OldButtonTrackedElement = class extends OldButton.Element {} as any;
    Object.assign(OldButtonTrackedElement, OldButton.Element);

    NewButtonTrackedElement = class extends NewButton.Element {} as any;
    Object.assign(NewButtonTrackedElement, NewButton.Element);

    OldButtonTracked = defineElementDefinition(
      `knyt-${crypto.randomUUID()}`,
      OldButtonTrackedElement as any,
    );

    NewButtonTracked = defineElementDefinition(
      `knyt-${crypto.randomUUID()}`,
      NewButtonTrackedElement as any,
    );
  });

  it("0. If for some reason both constructors are the same, do nothing.", async () => {
    const oldLifecycle =
      OldButtonTracked.Element[__knytElementComposedLifecycle];

    await performHotUpdate({
      tagName: OldButtonTracked.tagName,
      prevConstructor: OldButtonTracked.Element,
      nextConstructor: OldButtonTracked.Element,
      instances: [],
    });

    expect(OldButtonTracked.Element[__knytElementComposedLifecycle]).toBe(
      oldLifecycle,
    );
  });

  describe("for the constructor", () => {
    it("1. Replace `properties` static property.", async () => {
      const oldProperties = OldButtonTracked.Element.properties;
      const newProperties = NewButtonTracked.Element.properties;

      expect(OldButtonTracked.Element.properties).toBe(oldProperties);

      await performHotUpdate({
        tagName: OldButtonTracked.tagName,
        prevConstructor: OldButtonTrackedElement,
        nextConstructor: NewButtonTrackedElement,
        instances: [],
      });

      expect(OldButtonTrackedElement.properties).toBe(newProperties);
    });

    it("2. Update reactive properties as defined on the prototype.", async () => {
      const element = document.createElement(OldButtonTracked.tagName);

      expect(element.oldProp).toBe(123);
      expect(element.newProp).toBeUndefined();

      await performHotUpdate({
        tagName: OldButtonTracked.tagName,
        prevConstructor: OldButtonTrackedElement,
        nextConstructor: NewButtonTrackedElement,
        instances: [element],
      });

      expect(element.oldProp).toBeUndefined();
      expect(element.newProp).toBe("abc");
    });

    it("3. Replace `lifecycle` static method.", async () => {
      const oldLifecycle =
        OldButtonTracked.Element[__knytElementComposedLifecycle];
      const newLifecycle =
        NewButtonTracked.Element[__knytElementComposedLifecycle];

      expect(OldButtonTracked.Element[__knytElementComposedLifecycle]).toBe(
        oldLifecycle,
      );

      await performHotUpdate({
        tagName: OldButtonTracked.tagName,
        prevConstructor: OldButtonTrackedElement,
        nextConstructor: NewButtonTrackedElement,
        instances: [],
      });

      expect(OldButtonTrackedElement[__knytElementComposedLifecycle]).toBe(
        newLifecycle,
      );
    });

    it("4. Replace `styleSheet` static property.", async () => {
      const oldStyleSheet = OldButtonTrackedElement.styleSheet;
      const newStyleSheet = NewButtonTrackedElement.styleSheet;

      expect(OldButtonTrackedElement.styleSheet).toBe(oldStyleSheet as any);

      await performHotUpdate({
        tagName: OldButtonTracked.tagName,
        prevConstructor: OldButtonTrackedElement,
        nextConstructor: NewButtonTrackedElement,
        instances: [],
      });

      expect(OldButtonTrackedElement.styleSheet).toBe(newStyleSheet as any);
    });
  });

  describe("for each instance", () => {
    it("5-1 (and 6-1, 6-2). Simulate disconnection for each previously connected instance.", async () => {
      const oldElement = document.createElement(
        OldButtonTracked.tagName,
      ) as KnytElementComposed;

      document.body.appendChild(oldElement);

      expect(oldElement.isConnected).toBe(true);

      // Wait for the element to settle.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(oldButtonController.hostConnected).toHaveBeenCalledTimes(1);
      expect(oldButtonController.hostDisconnected).toHaveBeenCalledTimes(0);
      expect(oldButtonDelegate.hostMounted).toHaveBeenCalledTimes(1);
      expect(oldButtonDelegate.hostUnmounted).toHaveBeenCalledTimes(0);

      await performHotUpdate({
        tagName: OldButtonTracked.tagName,
        prevConstructor: OldButtonTrackedElement,
        nextConstructor: NewButtonTrackedElement,
        instances: [oldElement],
      });

      // Wait for the element to settle.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(oldButtonController.hostConnected).toHaveBeenCalledTimes(1);
      expect(oldButtonController.hostDisconnected).toHaveBeenCalledTimes(1);
      expect(oldButtonDelegate.hostMounted).toHaveBeenCalledTimes(1);
      expect(oldButtonDelegate.hostUnmounted).toHaveBeenCalledTimes(1);
    });

    it("6-3. From each instance, remove all current renderers.", async () => {
      const oldElement = document.createElement(
        OldButtonTracked.tagName,
      ) as KnytElementComposed;

      const oldRender = await render(oldElement);

      expect(oldRender).toBe(
        [
          `<${OldButtonTracked.tagName}>`,
          `<template shadowrootmode="open">`,
          `<span>Old Renderer</span><button>Old Button</button>`,
          `</template>`,
          `</${OldButtonTracked.tagName}>`,
        ].join(""),
      );

      await performHotUpdate({
        tagName: OldButtonTracked.tagName,
        prevConstructor: OldButtonTrackedElement,
        nextConstructor: NewButtonTrackedElement,
        instances: [oldElement],
      });

      const newRender = await render(oldElement);

      expect(newRender).toBe(
        [
          `<${OldButtonTracked.tagName}>`,
          `<template shadowrootmode="open">`,
          `<section>New Renderer</section><button>New Button</button>`,
          `</template>`,
          `</${OldButtonTracked.tagName}>`,
        ].join(""),
      );
    });

    it("7. Update reactive properties on each instance.", async () => {
      const oldElement: TestElement = document.createElement(
        OldButtonTracked.tagName,
      );

      const allPropsListener = mock();
      const oldPropListener = mock();
      const newPropListener = mock();

      // Add a listener to all properties.
      // It should be called when any property changes,
      // but after the hot update it should not be called again,
      // because the listener should be removed.
      oldElement.onPropChange(allPropsListener);

      // Add a listener to the old property.
      // It should be called when the property changes,
      // but after the hot update it should not be called again,
      // because the property will no longer be reactive,
      // and the listener should be removed.
      oldElement.onPropChange("oldProp", oldPropListener);

      // `newProp` isn't a valid reactive property yet,
      // but we can still attach a listener to verify
      // that it gets removed. The listener should never
      // be called.
      oldElement.onPropChange("newProp", newPropListener);

      oldElement.oldProp = 456;

      // Wait for the element to settle.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(allPropsListener).toHaveBeenCalledTimes(2);
      expect(allPropsListener).toHaveBeenCalledWith({
        currentValue: 123,
        previousValue: undefined,
        propertyName: "oldProp",
      });
      expect(allPropsListener).toHaveBeenCalledWith({
        currentValue: 456,
        previousValue: 123,
        propertyName: "oldProp",
      });

      expect(oldPropListener).toHaveBeenCalledTimes(2);
      expect(oldPropListener).toHaveBeenCalledWith(123, undefined);
      expect(oldPropListener).toHaveBeenCalledWith(456, 123);

      await performHotUpdate({
        tagName: OldButtonTracked.tagName,
        prevConstructor: OldButtonTrackedElement,
        nextConstructor: NewButtonTrackedElement,
        instances: [oldElement],
      });

      // Should not trigger anything, because it's now
      // a plain property.
      oldElement.oldProp = 789;
      oldElement.newProp = "def";

      // Wait for the element to settle.
      await new Promise((resolve) => setTimeout(resolve, 0));

      // None of the listeners should have been called again,
      // because they should have all been removed.
      {
        expect(allPropsListener).toHaveBeenCalledTimes(2);
        expect(oldPropListener).toHaveBeenCalledTimes(2);
        expect(newPropListener).toHaveBeenCalledTimes(0);
      }

      // Now we can add a listener to the new property,
      // and it should work as expected.
      oldElement.onPropChange("newProp", newPropListener);

      oldElement.newProp = "ghi";

      // Wait for the element to settle.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(newPropListener).toHaveBeenCalledTimes(1);
      expect(newPropListener).toHaveBeenCalledWith("ghi", "def");
    });

    it("8. Perform post-construction logic for each instance.", async () => {
      const oldElement = document.createElement(
        OldButtonTracked.tagName,
      ) as KnytElementComposed;

      oldElement[__postConstruct] = mock(
        oldElement[__postConstruct].bind(oldElement),
      );

      expect(oldElement[__postConstruct]).toHaveBeenCalledTimes(0);

      await performHotUpdate({
        tagName: OldButtonTracked.tagName,
        prevConstructor: OldButtonTrackedElement,
        nextConstructor: NewButtonTrackedElement,
        instances: [oldElement],
      });

      expect(oldElement[__postConstruct]).toHaveBeenCalledTimes(1);
    });

    it("9. Update the renderer function for each instance.", async () => {
      const oldElement = document.createElement(
        OldButtonTracked.tagName,
      ) as KnytElementComposed;

      const oldRenderer = oldElement[__knytElementComposedRenderer];
      const oldRender = await render(
        html.fragment.$(await oldRenderer.call(oldElement, oldElement)),
      );

      expect(oldRender).toBe(`<button>Old Button</button>`);

      await performHotUpdate({
        tagName: OldButtonTracked.tagName,
        prevConstructor: OldButtonTrackedElement,
        nextConstructor: NewButtonTrackedElement,
        instances: [oldElement],
      });

      const newRenderer = oldElement[__knytElementComposedRenderer];

      expect(newRenderer).not.toBe(oldRenderer);

      const newRender = await render(
        html.fragment.$(await newRenderer.call(oldElement, oldElement)),
      );

      expect(newRender).toBe(`<button>New Button</button>`);
    });

    it("10-1. Simulate reconnection for each previously connected instance.", async () => {
      const oldElement = document.createElement(
        OldButtonTracked.tagName,
      ) as KnytElementComposed;

      document.body.appendChild(oldElement);

      expect(oldElement.isConnected).toBe(true);

      // Wait for the element to settle.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(oldButtonController.hostConnected).toHaveBeenCalledTimes(1);
      expect(newButtonController.hostConnected).toHaveBeenCalledTimes(0);

      await performHotUpdate({
        tagName: OldButtonTracked.tagName,
        prevConstructor: OldButtonTrackedElement,
        nextConstructor: NewButtonTrackedElement,
        instances: [oldElement],
      });

      // Wait for the element to settle.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(oldButtonController.hostConnected).toHaveBeenCalledTimes(1);
      expect(newButtonController.hostConnected).toHaveBeenCalledTimes(1);
    });
  });
});
