/// <reference types="bun-types" />
/// <reference lib="dom" />

import { typeCheck } from "@knyt/artisan";
import { dom, type ElementBuilder } from "@knyt/weaver";
import { describe, expect, it } from "bun:test";

import { define } from "../define/mod";
import { KnytElement } from "../KnytElement";
import type { LazyElementDefinition } from "../lazy";
import type {
  ElementDefinition,
  InferProps,
  PropertiesDefinition,
  PropertyDefinition,
  PropertyInfo,
} from "../types";

describe("types", () => {
  type TestTagName = "knyt-test";
  type TestElementProperties = {
    foo: PropertyDefinition<PropertyInfo<string, "foolish">>;
    bar: PropertyDefinition<PropertyInfo<boolean, "barred">>;
    qux: PropertyDefinition<PropertyInfo<string[], false>>;
  };
  type TestElement = KnytElement & {
    foo: string | undefined;
    bar: boolean | undefined;
    qux: string[] | undefined;
  };
  type TestElementConstructor = {
    properties: TestElementProperties;
    styleSheet: undefined;
    new (): TestElement;
  };

  describe("PropertiesDefinition.ToProps", () => {
    type Expected = {
      foo: string | undefined;
      bar: boolean | undefined;
      qux: string[] | undefined;
    };
    type Result = PropertiesDefinition.ToProps<TestElementProperties>;

    it("should match the expected type", () => {
      typeCheck<Result>(typeCheck.identify<Expected>());
    });

    it("should match the expected keys", () => {
      expect<keyof Result>("" as keyof Expected);
    });
  });

  describe("ElementDefinition", () => {
    type Expected = {
      readonly __isKnytElementDefinition: true;
      (): ElementBuilder.DOM<TestElement>;
      html: () => ElementBuilder.HTML<{
        foolish: string | null | undefined;
        barred: boolean | undefined;
      }>;
      Element: TestElementConstructor;
      tagName: TestTagName;
    };
    type Result = ElementDefinition<TestElementConstructor, TestTagName>;

    it("should match the expected type", () => {
      typeCheck<Result>(typeCheck.identify<Expected>());
      expect<Result["html"]>({} as Expected["html"]);
      expect<Result["Element"]>({} as Expected["Element"]);
      expect<Result["tagName"]>({} as Expected["tagName"]);
      expect<ReturnType<Result>>({} as ReturnType<Expected>);
    });

    it("should match the expected keys", () => {
      // Prefix the key with `@` to force the type to be a string literal for visual comparison
      expect<`@${keyof Result}`>("" as `@${keyof Expected}`);
    });

    it("should contain the same property names as LazyElementDefinition for consistency", () => {
      type Expected = `_${keyof LazyElementDefinition<
        TestElementConstructor,
        TestTagName
      >}`;
      type Result = `_${keyof ElementDefinition<
        TestElementConstructor,
        TestTagName
      >}`;

      expect<Result>("" as Expected);
      expect<Expected>("" as Result);
    });
  });

  describe("KnytElement.ToProps", () => {
    type Expected = {
      foo: string | undefined;
      bar: boolean | undefined;
      qux: string[] | undefined;
    };
    type Result = KnytElement.ToProps<TestElementConstructor>;

    it("should match the expected type", () => {
      typeCheck<Result>(typeCheck.identify<Expected>());
    });

    it("should match the expected keys", () => {
      expect<keyof Result>("" as keyof Expected);
    });
  });

  describe("KnytElement.ToAttributes", () => {
    type Expected = {
      foolish: string | null | undefined;
      barred: boolean | undefined;
    };
    type Result = KnytElement.ToAttributes<TestElementConstructor>;

    it("should match the expected type", () => {
      typeCheck<Result>(typeCheck.identify<Expected>());
    });

    it("should match the expected keys", () => {
      expect<keyof Result>("" as keyof Expected);
    });
  });

  describe("KnytElement.Constructor.ToPropertiesDefinition", () => {
    type Result =
      KnytElement.Constructor.ToPropertiesDefinition<TestElementConstructor>;
    type Expected = TestElementProperties;

    it("should match the expected type", () => {
      typeCheck<Result>(typeCheck.identify<Expected>());
    });

    it("should match the expected keys", () => {
      expect<keyof Result>("" as keyof Expected);
    });
  });

  describe("PropertiesDefinition.ToAttributes", () => {
    type Expected = {
      foolish: string | null | undefined;
      barred: boolean | undefined;
    };

    type Result = PropertiesDefinition.ToAttributes<TestElementProperties>;

    it("should match the expected type", () => {
      typeCheck<Result>(typeCheck.identify<Expected>());
    });

    it("should match the expected keys", () => {
      expect<keyof Result>("" as keyof Expected);
    });
  });

  describe("KnytElement.FromPropertiesDefinition", () => {
    type Expected = KnytElement & {
      foo: string | undefined;
      bar: boolean | undefined;
      qux: string[] | undefined;
    };
    type Input = TestElementProperties;
    type Result = KnytElement.FromPropertiesDefinition<Input>;

    it("should match the expected type", () => {
      typeCheck<Result>(typeCheck.identify<Expected>());
    });

    it("should match the expected keys", () => {
      expect<keyof Result>("" as keyof Expected);
    });

    it("should have accurate types for props", () => {
      expect<Result["foo"]>("foo");
      expect<Result["foo"]>(undefined);
      // @ts-expect-error - should not allow number
      expect<Result["foo"]>(1234);

      expect<Result["bar"]>(true);
      expect<Result["bar"]>(false);
      expect<Result["bar"]>(undefined);
      // @ts-expect-error - should not allow string
      expect<Result["bar"]>("foo");

      expect<Result["qux"]>(["foo"]);
      expect<Result["qux"]>([]);
      expect<Result["qux"]>(undefined);
      // @ts-expect-error - should not allow string
      expect<Result["qux"]>("foo");
      // @ts-expect-error - should not allow number array
      expect<Result["qux"]>([1234]);
    });
  });

  describe("Constructor", () => {
    type Expected = {
      new (): TestElement;
      properties: TestElementProperties;
      styleSheet: KnytElement.StaticStyleSheet;
    };
    type Input = TestElementProperties;
    type Result = KnytElement.Constructor.FromPropertiesDefinition<Input>;

    it("should match the expected type", () => {
      typeCheck<Result>(typeCheck.identify<Expected>());
      expect<Result["properties"]>({} as Expected["properties"]);
      expect<InstanceType<Result>>({} as InstanceType<Expected>);
    });

    it("should match the expected keys", () => {
      expect<keyof Result>("properties" as const);
      expect<keyof Expected>("properties" as const);
    });

    it("should have accurate type for the instance", () => {
      type TestResult = InstanceType<Result>;
      type Expected = KnytElement & {
        foo: string | undefined;
        bar: boolean | undefined;
        qux: string[] | undefined;
      };

      expect<TestResult>({} as Expected);

      // `foo` property
      {
        expect<TestResult["foo"]>("");
        expect<Expected["foo"]>("");
        expect<TestResult["foo"]>(undefined);
        expect<Expected["foo"]>(undefined);
        // @ts-expect-error - should not allow boolean
        expect<TestResult["foo"]>(true);
        // @ts-expect-error - should not allow boolean
        expect<Expected["foo"]>(true);
        // @ts-expect-error - should not allow number
        expect<TestResult["foo"]>(1234);
        // @ts-expect-error - should not allow number
        expect<Expected["foo"]>(1234);
      }

      // `bar` property
      {
        expect<TestResult["bar"]>(true);
        expect<Expected["bar"]>(true);
        expect<TestResult["bar"]>(false);
        expect<Expected["bar"]>(false);
        expect<TestResult["bar"]>(undefined);
        expect<Expected["bar"]>(undefined);
        // @ts-expect-error - should not allow string
        expect<TestResult["bar"]>("");
        // @ts-expect-error - should not allow string
        expect<Expected["bar"]>("");
        // @ts-expect-error - should not allow number
        expect<TestResult["bar"]>(1234);
        // @ts-expect-error - should not allow number
        expect<Expected["bar"]>(1234);
      }

      // `qux` property
      {
        expect<TestResult["qux"]>(["hello"]);
        expect<Expected["qux"]>(["hello"]);
        expect<TestResult["qux"]>(undefined);
        expect<Expected["qux"]>(undefined);
        // @ts-expect-error - should not allow string
        expect<TestResult["qux"]>("");
        // @ts-expect-error - should not allow string
        expect<Expected["qux"]>("");
        // @ts-expect-error - should not allow number array
        expect<TestResult["qux"]>([1234]);
        // @ts-expect-error - should not allow number array
        expect<Expected["qux"]>([1234]);
      }

      // `KnytElement` properties
      {
        expect<TestResult["onPropChange"]>(
          (() => {}) as unknown as Expected["onPropChange"],
        );
      }
    });
  });

  describe("ElementDefinition.FromPropertiesDefinition", () => {
    type Input = [TestTagName, TestElementProperties];
    type Result = ElementDefinition.FromPropertiesDefinition<
      Input[0],
      Input[1]
    >;

    it("should match the expected type", () => {
      const expected = {} as {
        readonly __isKnytElementDefinition: true;
        (): ElementBuilder.DOM<
          KnytElement.FromPropertiesDefinition<TestElementProperties>
        >;
        Element: KnytElement.Constructor.FromPropertiesDefinition<TestElementProperties>;
        tagName: TestTagName;
        html: () => ElementBuilder.HTML<
          PropertiesDefinition.ToAttributes<TestElementProperties>
        >;
      };

      expect<Result>(expected);
    });

    it("should match the expected keys", () => {
      expect<keyof Result>("" as "tagName" | "Element" | "html");
    });

    describe("Builders()", () => {
      type TestBuilder = ReturnType<Result>;

      it("should return an accurate type", () => {
        const expected = {} as ElementBuilder.DOM<TestElement>;

        expect<TestBuilder>(expected);
      });
    });
  });

  describe("InferProps", () => {
    const fooProperties = {
      foo: define.property().string().attribute("foo"),
    };

    const QuxDefinition = define.element(`knyt-${crypto.randomUUID()}`, {
      properties: {
        qux: define.prop.bool.attr("qux"),
      },
      lifecycle() {
        return () => dom.fragment;
      },
    });

    const BarTemplate = define.view((props: { bar?: number }) => {
      return dom.fragment;
    });

    class BazElement extends KnytElement {
      static properties = {
        baz: define.property().string().attribute("baz"),
      };

      declare baz: boolean | undefined;
    }

    const BazDefinition = define.element(
      // Type cast to any to avoid HTMLElementTagNameMap check
      "test-infer-reactive-props-class" as any,
      BazElement,
    );

    it("infer reactive properties from a properties definition", () => {
      type Expected = {
        foo?: string;
      };
      type Result = InferProps<typeof fooProperties>;

      typeCheck<Result>(typeCheck.identify<Expected>());
      expect<Expected>({} as Result);
      expect<keyof Result>("" as keyof Expected);
      expect<keyof Expected>("" as keyof Result);
    });

    it("infer reactive properties from an element definition from defineKnytElement", () => {
      type Expected = {
        qux?: boolean;
      };
      type Result = InferProps<typeof QuxDefinition>;

      typeCheck<Result>(typeCheck.identify<Expected>());
      expect<Expected>({} as Result);
      expect<keyof Result>("" as keyof Expected);
      expect<keyof Expected>("" as keyof Result);
    });

    it("infer reactive properties from an element definition from defineElementDefinition", () => {
      type Expected = {
        baz?: string;
      };
      type Result = InferProps<typeof BazDefinition>;

      typeCheck<Result>(typeCheck.identify<Expected>());
      expect<Expected>({} as Result);
      expect<keyof Result>("" as keyof Expected);
      expect<keyof Expected>("" as keyof Result);
    });

    it("infer reactive properties from an KnytElement constructor from defineKnytElement", () => {
      type Expected = {
        qux?: boolean;
      };
      type Result = InferProps<typeof QuxDefinition.Element>;

      typeCheck<Result>(typeCheck.identify<Expected>());
      expect<Expected>({} as Result);
      expect<keyof Result>("" as keyof Expected);
      expect<keyof Expected>("" as keyof Result);
    });

    it("infer reactive properties from an KnytElement constructor from defineElementDefinition", () => {
      type Expected = {
        baz?: string;
      };
      type Result = InferProps<typeof BazDefinition.Element>;

      typeCheck<Result>(typeCheck.identify<Expected>());
      expect<Expected>({} as Result);
      expect<keyof Result>("" as keyof Expected);
      expect<keyof Expected>("" as keyof Result);
    });

    it("infer reactive properties from a View", () => {
      type Expected = {
        bar?: number;
      };
      type Result = InferProps<typeof BarTemplate>;

      typeCheck<Result>(typeCheck.identify<Expected>());
      expect<Expected>({} as Result);
      expect<keyof Result>("" as keyof Expected);
      expect<keyof Expected>("" as keyof Result);
    });

    describe("ElementConstructor", () => {
      it("infer reactive properties from an KnytElement constructor from defineElementDefinition", () => {
        type Expected = {
          baz?: string;
        };
        type Result = InferProps.ElementConstructor<
          typeof BazDefinition.Element
        >;

        typeCheck<Result>(typeCheck.identify<Expected>());
        expect<Expected>({} as Result);
        expect<keyof Result>("" as keyof Expected);
        expect<keyof Expected>("" as keyof Result);
      });
    });

    it("infer props from an arbitrary element definition", () => {
      const tagName = `knyt-${crypto.randomUUID()}`;
      class MyComponentElement extends HTMLElement {
        myProp = "foo";
      }
      const MyComponent = define.element(tagName, MyComponentElement);
      type Props = InferProps<typeof MyComponent>;

      // Should allow `myProp` to be a string
      expect<Props>({ myProp: "baz" });
      // @ts-expect-error `myProp` should be a string
      expect<Props>({ myProp: 100 });
    });
  });
});
