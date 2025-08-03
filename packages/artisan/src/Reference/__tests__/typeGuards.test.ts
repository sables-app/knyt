/// <reference types="bun-types" />
/// <reference lib="dom" />

import { describe, expect, it } from "bun:test";

import { createReference } from "../createReference";
import {
  __isKnytReference,
  isMutableReference,
  isReadableReference,
} from "../typeGuards";

describe("type guards", () => {
  describe("isReadableReference", () => {
    it("returns true for valid Reference objects", () => {
      const validReference = createReference("Hello, world!");

      expect(isReadableReference(validReference)).toBe(true);
    });

    it("returns true for valid `Reference.Readonly` objects", () => {
      const validReference = createReference("Hello, world!").asReadonly();

      expect(isReadableReference(validReference)).toBe(true);
    });

    it("returns false for invalid Reference objects", () => {
      const invalidReference = {
        value: "Hello, world!",
        [__isKnytReference]: false,
      };

      expect(isReadableReference(invalidReference)).toBe(false);
    });

    it("returns false for null values", () => {
      expect(isReadableReference(null)).toBe(false);
    });

    it("returns false for non-object values", () => {
      expect(isReadableReference(42)).toBe(false);
      expect(isReadableReference("string")).toBe(false);
      expect(isReadableReference(true)).toBe(false);
      expect(isReadableReference(undefined)).toBe(false);
    });
  });

  describe("isMutableReference", () => {
    it("returns true for valid Reference objects", () => {
      const validReference = createReference("Hello, world!");

      expect(isMutableReference(validReference)).toBe(true);
    });

    it("returns false for valid `Reference.Readonly` objects", () => {
      const validReference = createReference("Hello, world!").asReadonly();

      expect(isMutableReference(validReference)).toBe(false);
    });

    it("returns false for invalid Reference objects", () => {
      const invalidReference = {
        value: "Hello, world!",
        [__isKnytReference]: false,
      };

      expect(isMutableReference(invalidReference)).toBe(false);
    });

    it("returns false for null values", () => {
      expect(isMutableReference(null)).toBe(false);
    });

    it("returns false for non-object values", () => {
      expect(isMutableReference(42)).toBe(false);
      expect(isMutableReference("string")).toBe(false);
      expect(isMutableReference(true)).toBe(false);
      expect(isMutableReference(undefined)).toBe(false);
    });
  });
});
