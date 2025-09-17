/// <reference types="bun-types" />
/// <reference lib="dom" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import { dom } from "../ElementBuilder";
import { listen } from "../listen";
import type { AnyProps, TypedEvent } from "../types/mod";
import { getElementDeclarationFromElementBuilder } from "../utils/mod";

describe("listen", () => {
  it("should create a click listener", () => {
    const result = listen.click((event) => {
      expect<TypedEvent<AnyProps, MouseEvent>>(event);
    });

    expect(result).toEqual({
      type: "click",
      handler: expect.any(Function) as any,
      options: undefined,
    });
  });

  it("should create a listener with capture option", () => {
    const result = listen(
      "click",
      (event) => {
        expect<TypedEvent<AnyProps, MouseEvent>>(event);
      },
      { capture: true },
    );

    expect(result).toEqual({
      type: "click",
      handler: expect.any(Function) as any,
      options: {
        capture: true,
      },
    });
  });

  it("should create a click listener with capture option", () => {
    const result = listen.click(
      (event) => {
        expect<TypedEvent<AnyProps, MouseEvent>>(event);
      },
      { capture: true },
    );

    expect(result).toEqual({
      type: "click",
      handler: expect.any(Function) as any,
      options: {
        capture: true,
      },
    });
  });

  it("should create a passive click listener", () => {
    const result = listen.click.passive((event) => {
      expect<TypedEvent<AnyProps, MouseEvent>>(event);
    });

    expect(result).toEqual({
      type: "click",
      handler: expect.any(Function) as any,
      options: {
        passive: true,
      },
    });
  });

  it("should create a passive click listener with capture option", () => {
    const result = listen.click.passive(
      (event) => {
        expect<TypedEvent<AnyProps, MouseEvent>>(event);
      },
      { capture: true },
    );

    expect(result).toEqual({
      type: "click",
      handler: expect.any(Function) as any,
      options: {
        passive: true,
        capture: true,
      },
    });
  });

  it("should create a click listener with multiple modifiers", () => {
    const result = listen.click.stop.prevent.self.capture.once.passive(
      (event) => {
        expect<TypedEvent<AnyProps, MouseEvent>>(event);
      },
    );

    expect(result).toEqual({
      type: "click",
      handler: expect.any(Function) as any,
      options: {
        once: true,
        passive: true,
        capture: true,
      },
    });
  });

  it("should create a click listener with multiple modifiers and capture option", () => {
    const result = listen.click.stop.prevent.self.once.passive(
      (event) => {
        expect<TypedEvent<AnyProps, MouseEvent>>(event);
      },
      {
        capture: true,
      },
    );

    expect(result).toEqual({
      type: "click",
      handler: expect.any(Function) as any,
      options: {
        once: true,
        passive: true,
        capture: true,
      },
    });
  });

  describe("with element builder", () => {
    it("should create a div element with a click listener with capture option", () => {
      const result = dom.div.$on(
        listen(
          "click",
          (event) => {
            expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
            expect<TypedEvent<HTMLElement, MouseEvent>>(event);
            // @ts-expect-error event target is not an anchor element
            expect<TypedEvent<HTMLAnchorElement, MouseEvent>>(event);
          },
          { capture: true },
        ),
      );

      const { listeners } = getElementDeclarationFromElementBuilder(result);

      expect(listeners).toEqual({
        click__capture: {
          type: "click",
          handler: expect.any(Function) as any,
          options: { capture: true },
        },
      });
    });

    it("should create a div element with a click listener", () => {
      const result = dom.div.$on(
        listen.click((event) => {
          expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
          expect<TypedEvent<HTMLElement, MouseEvent>>(event);
          // @ts-expect-error event target is not an anchor element
          expect<TypedEvent<HTMLAnchorElement, MouseEvent>>(event);
        }),
      );

      const { listeners } = getElementDeclarationFromElementBuilder(result);

      expect(listeners).toEqual({
        click: {
          type: "click",
          handler: expect.any(Function) as any,
          options: undefined,
        },
      });
    });

    it("should create a div element with a click listener with capture option", () => {
      const result = dom.div.$on(
        listen.click(
          (event) => {
            expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
          },
          { capture: true },
        ),
      );

      const { listeners } = getElementDeclarationFromElementBuilder(result);

      expect(listeners).toEqual({
        click__capture: {
          type: "click",
          handler: expect.any(Function) as any,
          options: { capture: true },
        },
      });
    });

    it("should create a div element with a passive click listener", () => {
      const result = dom.div.$on(
        listen.click.passive((event) => {
          expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
        }),
      );

      const { listeners } = getElementDeclarationFromElementBuilder(result);

      expect(listeners).toEqual({
        click: {
          type: "click",
          handler: expect.any(Function) as any,
          options: {
            passive: true,
          },
        },
      });
    });

    it("should create a div element with a passive click listener with capture option", () => {
      const result = dom.div.$on(
        listen.click.passive(
          (event) => {
            expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
          },
          { capture: true },
        ),
      );

      const { listeners } = getElementDeclarationFromElementBuilder(result);

      expect(listeners).toEqual({
        click__capture: {
          type: "click",
          handler: expect.any(Function) as any,
          options: {
            passive: true,
            capture: true,
          },
        },
      });
    });

    it("should create a div element with a click listener with multiple modifiers", () => {
      const result = dom.div.$on(
        listen.click.stop.prevent.self.once.passive((event) => {
          expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
        }),
      );

      const { listeners } = getElementDeclarationFromElementBuilder(result);

      expect(listeners).toEqual({
        click: {
          type: "click",
          handler: expect.any(Function) as any,
          options: {
            once: true,
            passive: true,
          },
        },
      });
    });

    it("should create a div element with a click listener with multiple modifiers including the capture modifier", () => {
      const result = dom.div.$on(
        listen.click.stop.prevent.self.once.capture.passive((event) => {
          expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
        }),
      );

      const { listeners } = getElementDeclarationFromElementBuilder(result);

      expect(listeners).toEqual({
        click__capture: {
          type: "click",
          handler: expect.any(Function) as any,
          options: {
            once: true,
            passive: true,
            capture: true,
          },
        },
      });
    });

    it("should create a div element with a click listener with multiple modifiers and capture option", () => {
      const result = dom.div.$on(
        listen.click.stop.prevent.self.once.passive(
          (event) => {
            expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
          },
          {
            capture: true,
          },
        ),
      );

      const { listeners } = getElementDeclarationFromElementBuilder(result);

      expect(listeners).toEqual({
        click__capture: {
          type: "click",
          handler: expect.any(Function) as any,
          options: {
            once: true,
            passive: true,
            capture: true,
          },
        },
      });
    });
  });

  describe("event handling modifiers", () => {
    const target = document.createElement("div");
    const getTarget = mock(() => target);
    const getCurrentTarget = mock(() => target);
    const stopPropagation = mock(() => {});
    const preventDefault = mock(() => {});
    const eventStub = {
      type: "click",
      stopPropagation,
      preventDefault,
      get target() {
        return getTarget();
      },
      get currentTarget() {
        return getCurrentTarget();
      },
    } as unknown as TypedEvent<HTMLDivElement, PointerEvent>;

    beforeEach(() => {
      getTarget.mockClear();
      getCurrentTarget.mockClear();
      stopPropagation.mockClear();
      preventDefault.mockClear();
    });

    it("should create a click listener that calls stopPropagation", () => {
      const { handler } = listen.click.stop(() => {});

      handler.call(target, eventStub);

      expect(eventStub.stopPropagation).toHaveBeenCalledTimes(1);
      expect(eventStub.preventDefault).not.toHaveBeenCalled();
      expect(getTarget).not.toHaveBeenCalled();
      expect(getCurrentTarget).not.toHaveBeenCalled();
    });

    it("should create a click listener that calls preventDefault", () => {
      const { handler } = listen.click.prevent(() => {});

      handler.call(target, eventStub);

      expect(eventStub.stopPropagation).not.toHaveBeenCalled();
      expect(eventStub.preventDefault).toHaveBeenCalledTimes(1);
      expect(getTarget).not.toHaveBeenCalled();
      expect(getCurrentTarget).not.toHaveBeenCalled();
    });

    it("should create a click listener that only calls the handler if the target is the current target", () => {
      const clickHandler = mock(() => {});
      const { handler } = listen.click.self(clickHandler);

      handler.call(target, eventStub);

      expect(eventStub.stopPropagation).not.toHaveBeenCalled();
      expect(eventStub.preventDefault).not.toHaveBeenCalled();

      expect(getTarget).toHaveBeenCalledTimes(1);
      expect(getCurrentTarget).toHaveBeenCalledTimes(1);
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Change the target to not be the current target
      getCurrentTarget.mockReturnValue(document.createElement("div"));

      handler.call(target, eventStub);

      expect(getTarget).toHaveBeenCalledTimes(2);
      expect(getCurrentTarget).toHaveBeenCalledTimes(2);
      // The handler should not have been called again
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it("should create a click listener with all the event handling modifiers", () => {
      const { handler } = listen.click.stop.prevent.self(() => {});

      handler.call(target, eventStub);

      expect(eventStub.stopPropagation).toHaveBeenCalledTimes(1);
      expect(eventStub.preventDefault).toHaveBeenCalledTimes(1);
      expect(getTarget).toHaveBeenCalledTimes(1);
      expect(getCurrentTarget).toHaveBeenCalledTimes(1);
    });
  });
});
