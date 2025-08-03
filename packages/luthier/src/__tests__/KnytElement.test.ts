/// <reference types="bun-types" />
/// <reference lib="dom" />

import {
  computeRef,
  ref,
  typeCheck,
  type BoundMap,
  type Reference,
} from "@knyt/artisan";
import {
  build,
  uponElementUpdatesSettled,
  type BuildResult,
} from "@knyt/weaver";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import { SuperHero, type SuperHeroElement } from "./SuperHero";

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
    describe("onBeforeUpdate", () => {
      afterEach(() => {
        if (document.body.contains(hero)) {
          document.body.removeChild(hero);
        }
      });

      it("should call the onBeforeUpdate hook before the element is updated", async () => {
        const beforeUpdateHook = mock();

        document.body.appendChild(hero);

        expect(innerRef$.value).toBeNull();

        await uponElementUpdatesSettled(hero, null);

        expect(innerRef$.value).not.toBeNull();
        expect(innerRef$.value!.textContent).toBe(
          "Hello, Clark Kent (Superman)!",
        );

        hero.onBeforeUpdate(beforeUpdateHook);

        hero.name = "red cape guy";

        // The hook is not called synchronously
        expect(beforeUpdateHook).not.toHaveBeenCalled();

        // Wait for the next microtask to check the hook call.
        //
        // To clarify, the hook is called before the element is updated,
        // so we can't await `uponElementUpdatesSettled` or `updateComplete`
        // here, as that would wait for the element to be updated.
        await Promise.resolve();

        expect(beforeUpdateHook).toHaveBeenCalledWith({
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
        hero.onBeforeUpdate(({ changedProperties }) => {
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

        // The hook is called synchronously
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

        hero.onUpdated(updatedHook);

        hero.name = "Miles Morales";

        // The hook is not called synchronously
        expect(updatedHook).not.toHaveBeenCalled();

        await uponElementUpdatesSettled(hero, null);

        expect(updatedHook).toHaveBeenCalledTimes(1);
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
