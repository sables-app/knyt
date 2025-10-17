/// <reference types="bun-types" />

import { typeCheck } from "@knyt/artisan";
import { describe, it } from "bun:test";

import type { UndefinedXorNull } from "../types/mod.ts";

describe("types", () => {
  describe("UndefinedXorNull", () => {
    it("enforces the given type to be either `null` or `undefined`", () => {
      type InputA = null;
      type InputB = undefined;
      type InputC = null | undefined;
      type InputD = number;
      type InputE = null | undefined | number;
      type InputF = null | undefined | number | string;

      type ResultA = UndefinedXorNull<InputA>;
      type ResultB = UndefinedXorNull<InputB>;
      type ResultC = UndefinedXorNull<InputC>;
      type ResultD = UndefinedXorNull<InputD>;
      type ResultE = UndefinedXorNull<InputE>;
      type ResultF = UndefinedXorNull<InputF>;

      typeCheck<ResultA>(typeCheck.identify<null>());
      typeCheck<ResultB>(typeCheck.identify<undefined>());
      typeCheck<ResultC>(typeCheck.identify<never>());
      typeCheck<ResultD>(typeCheck.identify<never>());
      typeCheck<ResultE>(typeCheck.identify<never>());
      typeCheck<ResultF>(typeCheck.identify<never>());
    });
  });
});
