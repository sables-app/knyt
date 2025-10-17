/// <reference types="bun-types" />
/// <reference lib="dom" />

import {
  computeRef,
  ref,
  typeCheck,
  type BoundMap,
  type Reference,
} from "@knyt/artisan";
import type { LifecycleDelegate, ReactiveController } from "@knyt/tasker";
import {
  build,
  dom,
  uponElementUpdatesSettled,
  type BuildResult,
} from "@knyt/weaver";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import { define } from "../define/mod.ts";
import { SuperHero, type SuperHeroElement } from "./SuperHero.ts";

describe("KnytElement", () => {
  let hero: BuildResult<SuperHeroElement>;
  let innerRef$: Reference<HTMLDivElement | null>;

  beforeEach(async () => {
    innerRef$ = ref<HTMLDivElement | null>(null);
    hero = await build<SuperHeroElement>(
      SuperHero()
        .name("Superman")
        .alias("Clark Kent")
        .canFly(true)
        .innerRef$(innerRef$),
    );
  });

  describe("basic properties", () => {
    it("should have the correct initial property values", () => {
      expect(hero.name).toBe("Superman");
      expect(hero.getAttribute("name")).toBe("Superman");

      expect(hero.alias).toBe("Clark Kent");
      expect(hero.getAttribute("alias")).toBe("Clark Kent");

      expect(hero.canFly).toBe(true);
      expect(hero.getAttribute("flies")).toBe("");

      expect(hero.canWallCrawl).toBeUndefined();
      expect(hero.getAttribute("wall-crawls")).toBeNull();
    });

    // TODO: Consider making reactive properties enumerable on the instance as well.
    // Probably would be expensive. Perhaps make it an option in the property definition?
    it("only enumerates reactive properties on the prototype", () => {
      const propNames = Object.keys(Object.getPrototypeOf(hero));

      expect(propNames).toEqual([
        "name",
        "alias",
        "canFly",
        "canWallCrawl",
        "innerRef$",
      ]);
    });
  });

  describe("computeRef integration", () => {
    it("should compute a value based on individual observed properties", () => {
      const displayName$ = computeRef({
        dependencies: [hero.refProp("name"), hero.refProp("alias")],
        compute(name, alias) {
          return alias ? `${alias} (${name})` : name;
        },
      });

      hero.track(displayName$);

      expect(displayName$.value).toBe("Clark Kent (Superman)");
    });

    it("should compute a value based on individual observed properties as arguments", () => {
      const displayName$ = computeRef(
        hero.refProp("name"),
        hero.refProp("alias"),
        (name, alias) => {
          return alias ? `${alias} (${name})` : name;
        },
      );

      hero.track(displayName$);

      expect(displayName$.value).toBe("Clark Kent (Superman)");
    });
  });

  describe("observePropChange", () => {
    it("should return an observable that emits changes to observed properties", async () => {
      const propertyChange$ = hero.observePropChange();

      const subscriber = mock();

      propertyChange$.subscribe(subscriber);

      // No changes have been made yet
      expect(subscriber).not.toHaveBeenCalled();

      hero.name = "Batman";

      // Property changes are not emitted synchronously
      expect(subscriber).not.toHaveBeenCalled();

      await Promise.resolve();

      expect(subscriber).lastCalledWith({
        currentValue: "Batman",
        previousValue: "Superman",
        propertyName: "name",
      });

      hero.alias = "Bruce Wayne";

      await Promise.resolve();

      expect(subscriber).lastCalledWith({
        currentValue: "Bruce Wayne",
        previousValue: "Clark Kent",
        propertyName: "alias",
      });
    });
  });

  describe("lifecycle", () => {
    describe("onUpdateRequested", () => {
      afterEach(() => {
        if (document.body.contains(hero)) {
          document.body.removeChild(hero);
        }
      });

      it("should call the onUpdateRequested hook before the element is updated", async () => {
        const updateRequestedHook = mock();

        document.body.appendChild(hero);

        expect(innerRef$.value).toBeNull();

        await uponElementUpdatesSettled(hero, null);

        expect(innerRef$.value).not.toBeNull();
        expect(innerRef$.value!.textContent).toBe(
          "Hello, Clark Kent (Superman)!",
        );

        hero.onUpdateRequested(updateRequestedHook);

        hero.name = "red cape guy";

        // The hook is not called synchronously
        expect(updateRequestedHook).not.toHaveBeenCalled();

        // Wait for the next two microtasks to check the hook call.
        //
        // To clarify, the hook is called before the element is updated,
        // so we can't await `uponElementUpdatesSettled` or `updateComplete`
        // here, as that would wait for the element to be updated.
        //
        // The first one is to allow the property change to be processed,
        // and the second one is to allow the hook to be called.
        await Promise.resolve();
        await Promise.resolve();

        expect(updateRequestedHook).toHaveBeenCalledWith({
          abortController: expect.any(AbortController),
          changedProperties: expect.any(Map),
        });

        // The hook should be called before the element is updated,
        // so the contents of the element should not have changed yet.
        expect(innerRef$.value!.textContent).toBe(
          "Hello, Clark Kent (Superman)!",
        );

        await uponElementUpdatesSettled(hero, null);

        // The element should be updated after the hook is called,
        // so the contents of the element should have changed by now.
        expect(innerRef$.value!.textContent).toBe(
          "Hello, Clark Kent (red cape guy)!",
        );
      });

      it("exposes the expect types", async () => {
        hero.onUpdateRequested(({ changedProperties }) => {
          typeCheck<BoundMap.Readonly<any>>(
            typeCheck.identify(changedProperties),
          );
        });
      });
    });

    describe("onUnmounted", () => {
      afterEach(() => {
        if (document.body.contains(hero)) {
          document.body.removeChild(hero);
        }
      });

      it("should call the onUnmounted hook when the element is removed from the DOM", async () => {
        const unmountedHook = mock();

        document.body.appendChild(hero);

        await uponElementUpdatesSettled(hero, null);

        expect(document.body.contains(hero)).toBe(true);

        hero.onUnmounted(unmountedHook);

        expect(unmountedHook).not.toHaveBeenCalled();

        document.body.removeChild(hero);

        // Wait until the next microtask to allow the lifecycle hook to be called
        // All hooks are called asynchronously
        await Promise.resolve();

        expect(unmountedHook).toHaveBeenCalledTimes(1);
      });
    });

    describe("onUpdated", () => {
      afterEach(() => {
        if (document.body.contains(hero)) {
          document.body.removeChild(hero);
        }
      });

      it("should call the onUpdated hook when the element is updated", async () => {
        document.body.appendChild(hero);

        await uponElementUpdatesSettled(hero, null);

        expect(document.body.contains(hero)).toBe(true);

        const updatedHook = mock();

        hero.onAfterUpdate(updatedHook);

        hero.name = "Miles Morales";

        // The hook is not called synchronously
        expect(updatedHook).not.toHaveBeenCalled();

        await uponElementUpdatesSettled(hero, null);

        expect(updatedHook).toHaveBeenCalledTimes(1);
      });
    });

    describe("call order", () => {
      let shouldAbortUpdate = false;
      let callOrder: any[] = [];

      afterEach(() => {
        callOrder = [];
      });

      const Car = define.element(`knyt-${crypto.randomUUID()}`, {
        properties: {
          color: define.prop.str,
          speed: define.prop.num,
        },
        lifecycle() {
          this.onPropChange(() => {
            callOrder.push(["reactiveElement.onPropChange"]);
          });

          this.addController({
            hostConnected() {
              callOrder.push(["controller.hostConnected"]);
            },
            hostDisconnected() {
              callOrder.push(["controller.hostDisconnected"]);
            },
            hostUpdate() {
              callOrder.push(["controller.hostUpdate"]);
            },
            hostUpdated() {
              callOrder.push(["controller.hostUpdated"]);
            },
          } satisfies Required<ReactiveController>);

          this.addDelegate({
            hostBeforeMount() {
              callOrder.push(["delegate.hostBeforeMount"]);
            },
            hostUpdateRequested({ abortController, changedProperties }) {
              callOrder.push([
                "delegate.hostUpdateRequested",
                { changedProperties },
              ]);

              if (shouldAbortUpdate) {
                shouldAbortUpdate = false;
                callOrder.push(["delegate.hostUpdateRequested:abort"]);
                abortController.abort();
                callOrder.push(["delegate.hostUpdateRequested:aborted"]);
              }
            },
            // TODO: Add case for hostInterrupted
            hostInterrupted(interrupt) {
              callOrder.push(["delegate.hostInterrupted", { interrupt }]);
            },
            // TODO: Add case for hostErrorCaptured
            hostErrorCaptured(error) {
              callOrder.push(["delegate.hostErrorCaptured", { error }]);
            },
            hostMounted() {
              callOrder.push(["delegate.hostMounted"]);
            },
            // TODO: Add case for hostBeforeUpdate:abort
            hostBeforeUpdate({ abortController, changedProperties }) {
              callOrder.push([
                "delegate.hostBeforeUpdate",
                { changedProperties },
              ]);
            },
            hostAfterUpdate({ changedProperties }) {
              callOrder.push([
                "delegate.hostAfterUpdate",
                { changedProperties },
              ]);
            },
            hostUnmounted() {
              callOrder.push(["delegate.hostUnmounted"]);
            },
          } satisfies Required<LifecycleDelegate<any>>);

          return () => dom.h1.$(`${this.color} car going ${this.speed} mph`);
        },
      });

      it("should call all lifecycle hooks in the correct order", async () => {
        callOrder.push(["action: build with color and speed properties"]);
        const car = await build(Car().color("red").speed(100));
        callOrder.push(["action: build complete"]);

        await uponElementUpdatesSettled(car, 10);

        callOrder.push(["action: append to DOM"]);
        document.body.appendChild(car);
        callOrder.push(["action: appended to DOM"]);

        await uponElementUpdatesSettled(car, 10);

        callOrder.push(["action: change speed property"]);
        car.speed = 120;
        callOrder.push(["action: speed property changed"]);

        await uponElementUpdatesSettled(car, 10);

        shouldAbortUpdate = true;
        callOrder.push(["action: change color property"]);
        car.color = "blue";
        callOrder.push(["action: color property changed"]);

        await uponElementUpdatesSettled(car, 10);

        callOrder.push(["action: remove from DOM"]);
        document.body.removeChild(car);
        callOrder.push(["action: removed from DOM"]);

        // Wait for all microtasks to complete
        // to allow all lifecycle hooks to be called
        // All hooks are called asynchronously
        await new Promise((resolve) => setTimeout(resolve, 1));

        expect(callOrder).toMatchSnapshot();
      });
    });
  });

  describe("cloneNode", () => {
    it("should clone the element and its properties", async () => {
      hero.name = "Miles Morales";
      hero.alias = "Spider-Man";
      hero.canFly = false;
      hero.canWallCrawl = true;

      const clone = hero.cloneNode();

      // Assertions
      {
        expect(clone).toBeInstanceOf(SuperHero.Element);

        expect(clone).not.toBe(hero);

        expect(clone.name).toBe("Miles Morales");
        expect(clone.getAttribute("name")).toBe("Miles Morales");

        expect(clone.alias).toBe("Spider-Man");
        expect(clone.getAttribute("alias")).toBe("Spider-Man");

        // Reactive properties that are `false` are not set as attributes
        expect(clone.canFly).toBeUndefined();
        expect(clone.getAttribute("flies")).toBeNull();

        // Reactive properties that are `true` are set as attributes
        expect(clone.canWallCrawl).toBe(true);
        expect(clone.getAttribute("wall-crawls")).toBe("");

        // Reactive properties that are not associated with an attribute are not copied.
        expect(clone.innerRef$).toBeUndefined();
      }
    });
  });
});
