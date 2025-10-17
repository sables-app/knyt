/// <reference types="bun-types" />

import { beforeEach, describe, expect, it, mock } from "bun:test";

import {
  assertObservable,
  assertObserver,
  isObservable,
  isObserver,
} from "../typeGuards.ts";

describe("typeGuards", () => {
  describe("isObserver", () => {
    it("returns true for a valid observer object", () => {
      const observer = { next: () => {} };

      expect(isObserver(observer)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isObserver(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isObserver(undefined)).toBe(false);
    });

    it("returns false for a function", () => {
      const fn = () => {};

      expect(isObserver(fn)).toBe(false);
    });

    it("returns false for a function with a subscribe method", () => {
      const fn = Object.assign(() => {}, {
        next: () => {},
      });

      expect(isObserver(fn)).toBe(false);
    });

    it("returns false for object without next", () => {
      expect(isObserver({})).toBe(false);
    });

    it("returns false for object with non-function next", () => {
      expect(isObserver({ next: 123 })).toBe(false);
    });
  });

  describe("assertObserver", () => {
    it("does not throw for a valid observer", () => {
      expect(() => assertObserver({ next: () => {} })).not.toThrow();
    });

    it("throws for invalid observer", () => {
      expect(() => assertObserver({})).toThrow(TypeError);
      expect(() => assertObserver(null)).toThrow(TypeError);
      expect(() => assertObserver(undefined)).toThrow(TypeError);
    });
  });

  describe("isObservable", () => {
    it("returns true for a valid observable object", () => {
      const observable = {
        subscribe: () => {},
        asInterop: () => {},
      };
      expect(isObservable(observable)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isObservable(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isObservable(undefined)).toBe(false);
    });

    it("returns false for a function", () => {
      const fn = () => {};

      expect(isObservable(fn)).toBe(false);
    });

    it("returns false for a function with subscribe and asInterop methods", () => {
      const fn = Object.assign(() => {}, {
        subscribe: () => {},
        asInterop: () => {},
      });

      expect(isObservable(fn)).toBe(true);
    });

    it("returns false for object without subscribe", () => {
      const obj = { asInterop: () => {} };

      expect(isObservable(obj)).toBe(false);
    });

    it("returns false for object without asInterop", () => {
      const obj = { subscribe: () => {} };

      expect(isObservable(obj)).toBe(false);
    });

    it("returns false for object with non-function subscribe", () => {
      const obj = { subscribe: 123, asInterop: () => {} };

      expect(isObservable(obj)).toBe(false);
    });

    it("returns false for object with non-function asInterop", () => {
      const obj = { subscribe: () => {}, asInterop: 123 };

      expect(isObservable(obj)).toBe(false);
    });
  });

  describe("assertObservable", () => {
    it("does not throw for a valid observable", () => {
      const observable = {
        subscribe: () => {},
        asInterop: () => {},
      };

      expect(() => assertObservable(observable)).not.toThrow();
    });

    it("throws for invalid observable", () => {
      expect(() => assertObservable({})).toThrow(TypeError);
      expect(() => assertObservable(null)).toThrow(TypeError);
      expect(() => assertObservable(undefined)).toThrow(TypeError);
    });
  });
});
