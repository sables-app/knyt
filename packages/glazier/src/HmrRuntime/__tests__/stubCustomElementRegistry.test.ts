import {
  __knytElementComposedLifecycle,
  __knytElementComposedRenderer,
  define,
  type KnytElementComposed,
} from "@knyt/luthier";
import { beforeEach, describe, expect, it, mock } from "bun:test";

import { stubCustomElementRegistry } from "../stubCustomElementRegistry.ts";

describe("stubCustomElementRegistry", async () => {
  let customElementsMock: Record<
    keyof CustomElementRegistry,
    ReturnType<typeof mock>
  >;
  let $customElements: CustomElementRegistry;

  beforeEach(() => {
    customElementsMock = {
      define: mock(),
      get: mock(),
      upgrade: mock(),
      whenDefined: mock(),
    } as any;
    $customElements = {
      ...customElementsMock,
    } as unknown as CustomElementRegistry;
  });

  describe("stubCustomElementRegistry", () => {
    it("stubs the define method", () => {
      // Ensure the mock is in place.
      expect($customElements.define).toBe(customElementsMock.define);

      stubCustomElementRegistry($customElements);

      // After stubbing, the define method should be replaced.
      expect($customElements.define).not.toBe(customElementsMock.define);
    });

    it("should not stub if already stubbed", () => {
      // First stub
      stubCustomElementRegistry($customElements);

      // Should be stubbed now
      expect($customElements.define).not.toBe(customElementsMock.define);

      const stubbedDefine = $customElements.define;

      // Second stub attempt
      stubCustomElementRegistry($customElements);

      // Should remain the same stubbed define method.
      expect($customElements.define).toBe(stubbedDefine);
    });

    describe("stubbed define method", () => {
      const composedKnytElementPrev = define.element(
        `knyt-${crypto.randomUUID()}`,
        { lifecycle: () => () => "Prev Element" },
      ).Element;
      const composedKnytElementNext = define.element(
        `knyt-${crypto.randomUUID()}`,
        { lifecycle: () => () => "Next Element" },
      ).Element;

      beforeEach(() => {
        stubCustomElementRegistry($customElements);
      });

      describe("when a previous constructor is not defined", () => {
        beforeEach(() => {
          customElementsMock.get.mockReturnValue(undefined);
        });

        describe("when the next constructor is a composed KnytElement", () => {
          const nextConstructor = composedKnytElementNext;

          it("should call original define with tracked constructor", () => {
            const tagName = "knyt-test-element";

            {
              // Ensure the mock is in place.
              expect(customElementsMock.define).not.toHaveBeenCalled();
            }

            $customElements.define(tagName, nextConstructor);

            {
              // After calling define, the original define method should be called once.
              expect(customElementsMock.define).toHaveBeenCalledTimes(1);
            }

            const [tagNameParameter, trackingConstructor] =
              customElementsMock.define.mock.calls[0];

            {
              // The same tag name should be used.
              expect(tagNameParameter).toBe(tagName);
              // But the constructor should be different, as it is now tracked.
              expect(trackingConstructor).not.toBe(nextConstructor);
              // The tracking constructor should be a function (class).
              expect(trackingConstructor).toBeDefined();
              expect(typeof trackingConstructor).toBe("function");
            }

            // Normally this isn't possible, but for the sake of the test,
            // but with Happy DOM we can instantiate the element directly.
            // Note: In a real browser environment, the constructor is called by the browser
            const trackingElement = new trackingConstructor();

            {
              // The tracking element should be an instance of the original constructor
              expect(trackingElement instanceof nextConstructor).toBeTrue();
              // The tracking element should also be an instance of HTMLElement
              expect(trackingElement instanceof HTMLElement).toBeTrue();
            }
          });
        });

        describe("when the next constructor is NOT a composed KnytElement", () => {
          class nextConstructor extends HTMLElement {}

          it("should call original define with the next constructor", () => {
            const tagName = "knyt-test-element";

            {
              // Ensure the mock is in place.
              expect(customElementsMock.define).not.toHaveBeenCalled();
            }

            $customElements.define(tagName, nextConstructor);

            {
              // After calling define, the original define method should be called once.
              expect(customElementsMock.define).toHaveBeenCalledTimes(1);
              expect(customElementsMock.define).toHaveBeenCalledWith(
                tagName,
                nextConstructor,
                undefined,
              );
            }
          });
        });
      });

      describe("when a previous constructor is a composed KnytElement", () => {
        const prevConstructor = composedKnytElementPrev;

        beforeEach(() => {
          customElementsMock.get.mockReturnValue(prevConstructor);
        });

        describe("when the next constructor is also a composed KnytElement", () => {
          const nextConstructor = composedKnytElementNext;

          it("should call updateElementConstructor", () => {
            const originalPrevLifecycleFn = (
              prevConstructor as KnytElementComposed.Constructor
            )[__knytElementComposedLifecycle];

            $customElements.define("knyt-test-element", nextConstructor);

            const updatedPrevLifecycleFn = (
              prevConstructor as KnytElementComposed.Constructor
            )[__knytElementComposedLifecycle];

            {
              // The lifecycle function should be updated to the new one.
              expect(originalPrevLifecycleFn).not.toBe(updatedPrevLifecycleFn);
              // The updated lifecycle function should be the same as the
              // next constructor's lifecycle function.
              expect(updatedPrevLifecycleFn).toBe(
                (nextConstructor as KnytElementComposed.Constructor)[
                  __knytElementComposedLifecycle
                ],
              );
            }
          });
        });

        describe("when the next constructor is NOT a composed KnytElement", () => {
          class nextConstructor extends HTMLElement {}

          it("should log a warning and do nothing", () => {
            const originalWarn = console.warn;
            const consoleWarnMock = mock();

            // Mock console.warn
            console.warn = consoleWarnMock;

            $customElements.define("knyt-test-element", nextConstructor);

            {
              // The original define method should not be called.
              expect(customElementsMock.define).not.toHaveBeenCalled();
              // A warning should be logged.
              expect(consoleWarnMock).toHaveBeenCalledTimes(1);
              expect(consoleWarnMock).toHaveBeenCalledWith(
                `[Glazier:HMR] Cannot update <knyt-test-element>: previous constructor is a KnytElementComposed, but the next one is not.`,
              );
            }

            // Restore console.warn
            console.warn = originalWarn;
          });
        });
      });

      describe("when a previous constructor is NOT a composed KnytElement", () => {
        class prevConstructor extends HTMLElement {}

        beforeEach(() => {
          customElementsMock.get.mockReturnValue(prevConstructor);
        });

        describe("when the next constructor is a composed KnytElement", () => {
          const nextConstructor = composedKnytElementNext;

          it("should log a warning and do nothing", () => {
            const originalWarn = console.warn;
            const consoleWarnMock = mock();

            // Mock console.warn
            console.warn = consoleWarnMock;

            $customElements.define("knyt-test-element", nextConstructor);

            {
              // The original define method should not be called.
              expect(customElementsMock.define).not.toHaveBeenCalled();
              // A warning should be logged.
              expect(consoleWarnMock).toHaveBeenCalledTimes(1);
              expect(consoleWarnMock).toHaveBeenCalledWith(
                `[Glazier:HMR] Cannot update <knyt-test-element>: next constructor is a KnytElementComposed, but the previous one is not.`,
              );
            }

            // Restore console.warn
            console.warn = originalWarn;
          });
        });

        describe("when the next constructor is also NOT a composed KnytElement", () => {
          class nextConstructor extends HTMLElement {}

          it("should call original define with the next constructor", () => {
            const tagName = "knyt-test-element";

            {
              // Ensure the mock is in place.
              expect(customElementsMock.define).not.toHaveBeenCalled();
            }

            $customElements.define(tagName, nextConstructor);

            {
              // After calling define, the original define method should be called once.
              expect(customElementsMock.define).toHaveBeenCalledTimes(1);
              expect(customElementsMock.define).toHaveBeenCalledWith(
                tagName,
                nextConstructor,
                undefined,
              );
            }
          });
        });
      });
    });
  });
});
