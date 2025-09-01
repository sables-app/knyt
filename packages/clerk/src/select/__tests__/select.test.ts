/// <reference types="bun-types" />

import { describe, expect, it, mock } from "bun:test";

import { select } from "../select";
import * as selectors from "../selectors";

describe("select", () => {
  it("should have every selector as a property", () => {
    expect(Object.keys(select)).toEqual(Object.keys(selectors));
  });
});
