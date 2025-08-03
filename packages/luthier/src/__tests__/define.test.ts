/// <reference types="bun-types" />
/// <reference lib="dom" />
import { isObserver, observableToPromise } from "@knyt/artisan";
import { HostMonitor } from "@knyt/tasker";
import {
  build,
  dom,
  getElementDeclarationFromBuilder,
  isBuilder,
  isElementDeclaration,
  render,
  type Builder,
  type EventHandler,
} from "@knyt/weaver";
import { describe, expect, it, mock } from "bun:test";

import { COMPONENT_HOST_TAG_NAME } from "../define/defineComponent/ComponentController";
import { define } from "../define/mod";
import { isKnytElement, KnytElement } from "../KnytElement";
import { Film } from "./Film";
import { SuperHero } from "./SuperHero";

describe("define", () => {
  describe("define.element", () => {
    it("should define a custom element with a given tag name and renderer", () => {
      expect(SuperHero).toHaveProperty("html");
      expect(SuperHero).toHaveProperty("Element");
      expect(isKnytElement(new SuperHero.Element())).toBe(true);
      expect(SuperHero).toHaveProperty("tagName", "knyt-super-hero");
    });

    it("can be used to render HTML", async () => {
      const html = await render(SuperHero.html().flies(true).name("Superman"));

      expect(html).toBe(
        `<knyt-super-hero flies name="Superman"></knyt-super-hero>`,
      );
    });

    it("can be used to build DOM elements", async () => {
      type SuperHeroElement = InstanceType<typeof SuperHero.Element>;

      const el = await build<SuperHeroElement>(
        SuperHero().canFly(false).name("Batman"),
      );

      const hostMonitor = new HostMonitor(el);

      expect(el).toBeInstanceOf(SuperHero.Element);
      expect(el).toHaveProperty("canFly", false);
      expect(el).toHaveProperty("name", "Batman");
      expect(el.isConnected).toBe(false);
      expect(el.getAttribute("name")).toBe("Batman");
    });

    it("accepts an overload with a tag name and a constructor", () => {
      const elementConstructor = class extends KnytElement {};
      const elementDefinition = define.element(
        "knyt-villain",
        elementConstructor,
      );

      expect(elementDefinition).toHaveProperty("tagName", "knyt-villain");
      expect(elementDefinition).toHaveProperty("Element", elementConstructor);
    });

    it("accepts an overload with a tag name and an options object", async () => {
      const elementDefinition = define.element("knyt-bystander", {
        options: {
          shadowRoot: { mode: "closed" },
        },
        properties: {
          name: define.property().string(),
        },
        lifecycle: () => {
          return ({ name }) => dom.h1.$(`Hello, ${name}!`);
        },
      });

      expect(elementDefinition).toHaveProperty("tagName", "knyt-bystander");
      expect(elementDefinition).toHaveProperty("Element");

      expect(await render(elementDefinition().name("stranger"))).toEqual(
        `<knyt-bystander><template shadowrootmode="closed"><h1>Hello, stranger!</h1></template></knyt-bystander>`,
      );
    });
  });

  describe("define.component", () => {
    it("should return a function", () => {
      expect(typeof Film).toBe("function");
    });

    it("can be rendered to markup", async () => {
      const result = await render(
        Film().rating(4.2).filmTitle("Avengers").filmId(1),
        {
          reactiveElementTimeout: 100,
        },
      );

      expect(result).toBe(
        `<tr data-film-id="1" data-film-title="Avengers" data-rating="4.2"><td>1</td><td>Avengers</td><td>4.2</td><td><button>Delete</button></td></tr>`,
      );
    });

    it("produces the expected declarations", async () => {
      const viewBuilder = Film()
        .$key("peak-film")
        .rating(4.2)
        .title("Avengers");
      const viewDeclaration =
        await getElementDeclarationFromBuilder(viewBuilder);

      expect(isElementDeclaration(viewDeclaration)).toBe(true);
      expect(isElementDeclaration.MarkupHTML(viewDeclaration)).toBe(true);
      expect(isElementDeclaration.Fragment(viewDeclaration)).toBe(true);
      expect(viewDeclaration.children).toHaveLength(1);

      const rootBuilder = viewDeclaration.children[0];

      expect(isBuilder(rootBuilder)).toBe(true);

      const rootDeclaration = await getElementDeclarationFromBuilder(
        rootBuilder as Builder,
      );

      expect(isElementDeclaration(rootDeclaration)).toBe(true);

      expect(rootDeclaration).toHaveProperty("type", "tr");
      expect(rootDeclaration).toHaveProperty("renderMode", "opaque");
      expect(isObserver(rootDeclaration.ref)).toBe(true);
      expect(rootDeclaration.children).toHaveLength(0);
      expect(rootDeclaration).toHaveProperty("key", "peak-film");
    });

    it("can be used to build DOM elements", async () => {
      const handleMount = mock<() => void>();
      const handleUnmount = mock<() => void>();
      const handleDelete = mock<EventHandler.Mouse>();
      const builder = Film()
        .filmId(123)
        .rating(4.2)
        .filmTitle("Avengers")
        .onMount(handleMount)
        .onUnmount(handleUnmount)
        .onDelete(handleDelete);

      const builtView = await build<DocumentFragment>(builder);
      const rootEl = builtView.childNodes[0] as HTMLTableRowElement;

      // Assert build result
      {
        expect(builtView instanceof DocumentFragment).toBe(true);
        expect(builtView.childNodes).toHaveLength(1);
        // The root element shouldn't have any children yet,
        // because it is an opaque element.
        expect(rootEl.childNodes).toHaveLength(0);
        expect(rootEl.tagName).toBe("TR");
      }

      expect(rootEl.getAttribute("data-rating")).toBe("4.2");
      expect(rootEl.getAttribute("data-film-title")).toBe("Avengers");

      // An update to `root$` element reference is triggered,
      // and an `requestUpdate` is called on the host,
      // and subsequently `#updateRoot` is then called on the host
      // via the `ReactiveControllerHostAdapter`.
      await Promise.resolve();

      // Wait for the root to be updated.
      // The wait should be a deterministic number of microtasks.
      {
        /**
         * The exact number of microtasks
         *
         * @remarks
         *
         * While the exact number of microtasks that are needed to wait for any given
         * root to be updated is not easily predictable, it is a deterministic number
         * for any given declaration & root combination.
         *
         * This value will change as the implementation of the renderer changes.
         * The number of children and fragments used will affect this number.
         * If this becomes a problem, we can use a more dynamic approach to detect
         * when it ready, and not assert the number of microtasks.
         *
         * To clarify, we can't use `uponElementUpdatesSettled` or `updateComplete` here,
         * because we don't have access to the host element yet.
         *
         * TODO: Add support for gaining access to the host element via an element reference.
         */
        const NUM_OF_MICROTASKS = 15;

        for (let i = 0; i < NUM_OF_MICROTASKS; i++) {
          //  The host element should not be rendered yet.
          expect(
            builtView.querySelector(COMPONENT_HOST_TAG_NAME) === null,
          ).toBe(true);

          await Promise.resolve();
        }
      }

      const host = builtView.querySelector(COMPONENT_HOST_TAG_NAME)!;

      expect(isKnytElement(host)).toBe(true);

      expect(rootEl.outerHTML).toBe(
        // NOTE: Attributes don't render until the host is connected.
        // This is a carry-over from how Custom Elements work,
        // because attributes are not set in the construction phase.
        `<tr data-film-id="123" data-film-title="Avengers" data-rating="4.2"><td>123</td><td>Avengers</td><td>4.2</td><td><button>Delete</button><knyt-component-host></knyt-component-host></td></tr>`,
      );

      const hostMonitor = new HostMonitor(host);

      // Ensure the DOM environment connection functionality
      // is working as expected.
      {
        expect(rootEl.isConnected).toBe(false);
        expect(host.isConnected).toBe(false);

        document.body.appendChild(rootEl);

        expect(rootEl.isConnected).toBe(true);
        expect(host.isConnected).toBe(true);
      }

      // Assert state of component before the host is connected
      {
        expect(handleMount).not.toHaveBeenCalled();
        expect(rootEl.getAttribute("data-film-id")).toBe("123");
        expect(rootEl.getAttribute("data-film-title")).toBe("Avengers");
        expect(rootEl.getAttribute("data-rating")).toBe("4.2");
      }

      // Wait for the host to be connected.
      await observableToPromise(hostMonitor.isHostConnected$);

      // Assert state of component after the host is connected
      {
        expect(handleMount).toHaveBeenCalled();
      }

      // Test the event handler prop is set correctly
      {
        expect(handleDelete).not.toHaveBeenCalled();

        rootEl.querySelector("button")?.dispatchEvent(new Event("click"));

        expect(handleDelete).toHaveBeenCalled();
      }

      // Test the disconnection of the element
      {
        expect(handleUnmount).not.toHaveBeenCalled();

        document.body.removeChild(rootEl);

        expect(rootEl.isConnected).toBe(false);
        expect(host.isConnected).toBe(false);
        expect(handleUnmount).toHaveBeenCalled();
      }
    });
  });
});
