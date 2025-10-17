/// <reference types="bun-types" />
/// <reference lib="dom" />

import { typeCheck } from "@knyt/artisan";
import type { HTMLDivAttributes } from "@knyt/html-type";
import { describe, expect, it } from "bun:test";

import { createCustomElementBuilder, dom } from "../../ElementBuilder.ts";
import { listen } from "../../listen.ts";
import type {
  AnyProps,
  ElementBuilder,
  ElementDeclaration,
  TypedEvent,
  ViewBuilder,
  KnytDeclaration,
} from "../../types/mod.ts";

describe("types", () => {
  describe("ElementBuilder", () => {
    it("should handle event listeners consistently", () => {
      const builder = dom.div;

      builder.$on("click", (event) => {
        expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
      });

      builder.$on({
        type: "click",
        handler: (event) => {
          expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
        },
      });

      builder.$on({
        foo: {
          type: "click",
          handler: (event) => {
            expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
          },
        },
      });

      builder.$on(
        listen("click", (event) => {
          expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
        }),
      );

      builder.$on(
        listen.click((event) => {
          expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
        }),
      );

      builder.onclick((event) => {
        expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
      });

      builder.$props({
        onclick: (event) => {
          expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
        },
      });
    });

    // This test is to ensure that TypeScript correctly infers the types of
    // the properties that are being set on an element builder.
    //
    // We can't really test how the doc blocks are being reflected in the
    // TypeScript types, but we can test that the TypeScript types are
    // correctly inferred. This is currently done manually by checking the
    // doc blocks in VS Code.
    //
    // TODO: Find a way to test that the doc blocks are being correctly
    // reflected in the TypeScript types.
    // Perhaps we can use the TypeScript compiler API to check the types
    // of the properties that are being set on an element builder.
    it("should type property mutators correctly", () => {
      const input = dom.div
        // TypeScript should link this method back to the
        // `id` property from the `Event` interface.
        .id("test-id")
        // TypeScript should link this method back to the
        // `onclick` property from the `GlobalEventHandlers` interface.
        .onclick((event) => {
          // TypeScript should override the event type to `TypedEvent`
          expect<TypedEvent<HTMLDivElement, MouseEvent>>(event);
        })
        // TypeScript should link this method back to the
        // `className` property from the `Element` interface.
        .className("test-class")
        // Ideally, TypeScript would mark this as deprecated,
        // but doesn't do that, seemingly because the property
        // isn't deprecated on the `Element` interface.
        //
        // My understanding is that if any variant of the property
        // is not deprecated, TypeScript won't mark it as deprecated.
        .$("With properties")
        // TypeScript should have this method
        .$children("With properties");
    });

    describe("methods", () => {
      type TestElementBuilder = ElementBuilder<{
        foo: string;
        bar: boolean;
        qux: string[];
      }>;

      it("should have methods for the given properties", () => {
        expect(() => {
          const builder = true as unknown as TestElementBuilder;

          // The builder should have chainable methods for each property
          builder.foo("").bar(true).qux([""]);

          // @ts-expect-error - method should not exist
          builder.daz({});
        }).toThrow();
      });

      it("should have common methods", () => {
        expect(() => {
          const builder = true as unknown as TestElementBuilder;

          // The builder should have common methods
          builder
            .$key("greeting")
            .$ref(() => {})
            .dataset({ hello: "world" })
            .style({ display: "block" })
            .$children(dom.div);
        }).toThrow();
      });

      it("should have batch methods", () => {
        expect(() => {
          const builder = true as unknown as TestElementBuilder;

          // The builder should have common methods
          builder
            .$props({
              foo: "hello",
              bar: true,
            })
            .$attrs({
              foo: "hello",
            });
        }).toThrow();
      });
    });

    describe("ToNode", () => {
      // prettier-ignore
      it("should be able to infer the type of the node", () => {
        type A0 = ElementBuilder.ToNode<ElementBuilder>;
        type D1 = ElementBuilder.ToNode<ElementBuilder.DOM<any, HTMLDivElement>>;
        type D2 = ElementBuilder.ToNode<ElementBuilder.DOM<any, DocumentFragment>>;
        type M1 = ElementBuilder.ToNode<ElementBuilder.Markup<any, HTMLDivElement>>;
        type M2 = ElementBuilder.ToNode<ElementBuilder.Markup<any, DocumentFragment>>;

        typeCheck<A0>(typeCheck.identify<never>());
        typeCheck<D1>(typeCheck.identify<HTMLDivElement>());
        typeCheck<D2>(typeCheck.identify<DocumentFragment>());
        typeCheck<M1>(typeCheck.identify<HTMLDivElement>());
        typeCheck<M2>(typeCheck.identify<DocumentFragment>());
      });
    });
  });

  describe("ElementDeclaration", () => {
    describe("ToNode", () => {
      it("should be able to infer the type of the node", () => {
        type A1 = ElementDeclaration.ToNode<ElementDeclaration>;
        type A2 = ElementDeclaration.ToNode<
          ElementDeclaration<any, HTMLDivElement>
        >;
        type A3 = ElementDeclaration.ToNode<
          ElementDeclaration<any, DocumentFragment>
        >;

        typeCheck<A1>(typeCheck.identify<AnyProps>());
        typeCheck<A2>(typeCheck.identify<HTMLDivElement>());
        typeCheck<A3>(typeCheck.identify<DocumentFragment>());
      });
    });
  });

  describe("ViewBuilder", () => {
    describe("ToNode", () => {
      it("should be able to infer the type of the node", () => {
        type A1 = ViewBuilder.ToNode<ViewBuilder>;
        type A2 = ViewBuilder.ToNode<ViewBuilder<any, HTMLDivElement>>;
        type A3 = ViewBuilder.ToNode<ViewBuilder<any, DocumentFragment>>;

        typeCheck<A1>(typeCheck.identify<Element>());
        typeCheck<A2>(typeCheck.identify<HTMLDivElement>());
        typeCheck<A3>(typeCheck.identify<DocumentFragment>());
      });
    });
  });

  describe("KnytDeclaration", () => {
    describe("ToNode", () => {
      it("should be able to infer the type of the node", () => {
        type A0 = KnytDeclaration.ToNode<KnytDeclaration>;
        type A1 = KnytDeclaration.ToNode<KnytDeclaration<any, HTMLDivElement>>;
        type B1 = KnytDeclaration.ToNode<KnytDeclaration<any, DocumentFragment>>;
        type A2 = KnytDeclaration.ToNode<KnytDeclaration<any, HTMLDivElement>>;
        type B2 = KnytDeclaration.ToNode<KnytDeclaration<any, DocumentFragment>>;
        type EB0 = KnytDeclaration.ToNode<ElementBuilder>;
        // prettier-ignore
        type EBD1 = KnytDeclaration.ToNode<ElementBuilder.DOM<any, HTMLDivElement>>;
        // prettier-ignore
        type EBD2 = KnytDeclaration.ToNode<ElementBuilder.DOM<any, DocumentFragment>>;
        // prettier-ignore
        type EBM1 = KnytDeclaration.ToNode<ElementBuilder.Markup<any, HTMLDivElement>>;
        // prettier-ignore
        type EBM2 = KnytDeclaration.ToNode<ElementBuilder.Markup<any, DocumentFragment>>;
        type ED1 = KnytDeclaration.ToNode<ElementDeclaration>;
        // prettier-ignore
        type ED2 = KnytDeclaration.ToNode<ElementDeclaration<any, HTMLDivElement>>;
        // prettier-ignore
        type ED3 = KnytDeclaration.ToNode<ElementDeclaration<any, DocumentFragment>>;
        type VB1 = KnytDeclaration.ToNode<ViewBuilder>;
        type VB2 = KnytDeclaration.ToNode<ViewBuilder<any, HTMLDivElement>>;
        type VB3 = KnytDeclaration.ToNode<ViewBuilder<any, DocumentFragment>>;
        // prettier-ignore
        type EX1 = KnytDeclaration.ToNode<ElementBuilder<HTMLDivAttributes<{}>, HTMLDivElement, "markup">>;

        typeCheck<A0>(typeCheck.identify<AnyProps>());
        typeCheck<A1>(typeCheck.identify<HTMLDivElement>());
        typeCheck<B1>(typeCheck.identify<DocumentFragment>());
        typeCheck<A2>(typeCheck.identify<HTMLDivElement>());
        typeCheck<B2>(typeCheck.identify<DocumentFragment>());
        typeCheck<EB0>(typeCheck.identify<never>());
        typeCheck<EBD1>(typeCheck.identify<HTMLDivElement>());
        typeCheck<EBD2>(typeCheck.identify<DocumentFragment>());
        typeCheck<EBM1>(typeCheck.identify<HTMLDivElement>());
        typeCheck<EBM2>(typeCheck.identify<DocumentFragment>());
        typeCheck<ED1>(typeCheck.identify<AnyProps>());
        typeCheck<ED2>(typeCheck.identify<HTMLDivElement>());
        typeCheck<ED3>(typeCheck.identify<DocumentFragment>());
        typeCheck<VB1>(typeCheck.identify<Element>());
        typeCheck<VB2>(typeCheck.identify<HTMLDivElement>());
        typeCheck<VB3>(typeCheck.identify<DocumentFragment>());
        typeCheck<EX1>(typeCheck.identify<HTMLDivElement>());
      });
    });
  });

  describe("dom", () => {
    describe("property methods", () => {
      it("should handle the 'dataset' property being set", () => {
        dom.div.dataset({
          foo: "bar",
          bar: undefined,
        });
      });

      it("should handle the 'style' property being set", () => {
        dom.div.style({
          color: "red",
          backgroundColor: "blue",
          border: "1px solid black",
          display: "block",
        });
      });

      it("should handle the 'innerHTML' property being set", () => {
        dom.div.innerHTML("<div>Hello, World!</div>");
      });

      it("should not allow the 'outerHTML' property to be set", () => {
        // @ts-expect-error - `outerHTML` is not a valid property
        dom.div.outerHTML("");
      });

      it("should not allow the 'outerText' property to be set", () => {
        // @ts-expect-error - `outerText` is not a valid property
        dom.div.outerText("");
      });

      it("should not allow the 'then' property to be set", () => {
        type Props = {
          foo: string;
          then: () => void;
        };

        const builder = createCustomElementBuilder<Props>("fake-tag-name");

        // This should be valid
        builder.foo("bar");

        expect(() => {
          // @ts-expect-error - `then` is not a valid property
          builder.then(() => {});
        }).toThrow();
      });
    });

    describe("$props", () => {
      it("should handle the 'dataset' property being set", () => {
        dom.div.$props({
          dataset: {
            foo: "bar",
            bar: undefined,
          },
        });
      });

      it("should handle the 'style' property being set", () => {
        dom.div.$props({
          style: {
            color: "red",
            backgroundColor: "blue",
            border: "1px solid black",
            display: "block",
          },
        });
      });

      it("should handle the 'innerHTML' property being set", () => {
        dom.div.$props({
          innerHTML: "<div>Hello, World!</div>",
        });
      });

      it("should not allow the 'outerHTML' property to be set", () => {
        dom.div.$props({
          // @ts-expect-error - `outerHTML` is not a valid property
          outerHTML: "",
        });
      });

      it("should not allow the 'outerText' property to be set", () => {
        dom.div.$props({
          // @ts-expect-error - `outerText` is not a valid property
          outerText: "",
        });
      });

      it("should not allow the 'then' property to be set", () => {
        createCustomElementBuilder<{ then: () => void }>(
          "fake-tag-name",
        ).$props({
          // @ts-expect-error - `then` is not a valid property
          then: () => {},
        });
      });
    });
  });
});
