/// <reference types="bun-types" />

import { describe, it } from "bun:test";

import { typeCheck } from "../typeCheck";

describe("typeCheck", () => {
  it("should enforce strict type checking", () => {
    // @ts-expect-error HTMLDivElement is not exactly the same as Element
    typeCheck<HTMLDivElement>(typeCheck.identify<Element>());

    // @ts-expect-error HTMLDivElement is not exactly the same as Element
    typeCheck<Element>(typeCheck.identify<HTMLDivElement>());

    // HTMLDivElement is exactly the same as HTMLDivElement
    typeCheck<HTMLDivElement>(typeCheck.identify<HTMLDivElement>());

    // It should support never
    typeCheck<never>(typeCheck.identify<never>());

    // It should support any
    typeCheck<any>(typeCheck.identify<any>());

    // It should support unknown
    typeCheck<unknown>(typeCheck.identify<unknown>());

    // It should support void
    typeCheck<void>(typeCheck.identify<void>());

    // It should support null
    typeCheck<null>(typeCheck.identify<null>());

    // It should support undefined
    typeCheck<undefined>(typeCheck.identify<undefined>());

    // @ts-expect-error void is not exactly the same as undefined
    typeCheck<void>(typeCheck.identify<undefined>());

    // @ts-expect-error void is not exactly the same as undefined
    typeCheck<undefined>(typeCheck.identify<void>());

    // It should support union types
    typeCheck<string | number>(typeCheck.identify<string | number>());

    // @ts-expect-error string | number is not exactly the same as string
    typeCheck<string | number>(typeCheck.identify<string>());

    // @ts-expect-error string | number is not exactly the same as string
    typeCheck<string>(typeCheck.identify<string | number>());

    // It should support intersection types
    typeCheck<string & number>(typeCheck.identify<string & number>());

    // @ts-expect-error string & number is not exactly the same as string
    typeCheck<string & number>(typeCheck.identify<string>());

    // @ts-expect-error string & number is not exactly the same as string
    typeCheck<string>(typeCheck.identify<string & number>());

    class Foo {
      bar = "hello";
    }
    class Baz {
      bar = "hello";
    }

    // It supports equivalent types
    typeCheck<Foo>(typeCheck.identify<Baz>());
    typeCheck<Foo>(typeCheck.identify(new Baz()));
    typeCheck<Foo>(typeCheck.identify({ bar: "hello" }));
    typeCheck<Baz>(typeCheck.identify<Foo>());
    typeCheck<Baz>(typeCheck.identify(new Foo()));
    typeCheck<Baz>(typeCheck.identify({ bar: "hello" }));

    // @ts-expect-error "hello" is not exactly the same as string
    typeCheck<Foo>(typeCheck.identify({ bar: "hello" } as const));

    // It should support string literal types
    typeCheck<"world">(typeCheck.identify<"world">());

    const foo = "foo";

    // It supports template literal types
    typeCheck<`foo${string}`>(typeCheck.identify<`${typeof foo}${string}`>());
    // prettier-ignore
    typeCheck<`foo${string}`>(typeCheck.identify<`foo${string}`>(`foo${"Bar"}`));

    // @ts-expect-error "fooBar" is not exactly the same as `foo${string}`
    typeCheck<`foo${string}`>(typeCheck.identify(`foo${"Bar"}`));

    // It should support optional properties
    typeCheck<{ foo?: string }>(typeCheck.identify<{ foo?: string }>());

    // prettier-ignore
    // @ts-expect-error An optional property is not exactly
    // the same as a required property that can be undefined
    typeCheck<{ foo?: string }>(typeCheck.identify<{ foo: string | undefined }>());
  });
});
