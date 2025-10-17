import { describe, expect, it } from "bun:test";

import {
  isLifecycleInterrupt,
  LifecycleInterrupt,
} from "../LifecycleInterrupt.ts";

describe("LifecycleInterrupt", () => {
  describe("LifecycleInterrupt", () => {
    it("should create an instance with the correct reason", () => {
      const interrupt = new LifecycleInterrupt("test-reason");

      expect(interrupt).toBeInstanceOf(DOMException);
      expect(interrupt.reason).toBe("test-reason");
      expect(interrupt.name).toBe("LifecycleInterrupt");
      expect(interrupt.message).toBe("Knyt lifecycle interrupted: test-reason");
    });

    it("should support generic reason types", () => {
      const interrupt = new LifecycleInterrupt<{ code: number }>({ code: 42 });

      expect(interrupt.reason).toEqual({ code: 42 });
    });
  });

  describe("isLifecycleInterrupt", () => {
    it("should return true for LifecycleInterrupt instances", () => {
      const interrupt = new LifecycleInterrupt("reason");

      expect(isLifecycleInterrupt(interrupt)).toBe(true);
    });

    it("should return false for non-DOMException values", () => {
      expect(isLifecycleInterrupt({})).toBe(false);
      expect(isLifecycleInterrupt(null)).toBe(false);
      expect(isLifecycleInterrupt(undefined)).toBe(false);
      expect(isLifecycleInterrupt("string")).toBe(false);
      expect(isLifecycleInterrupt(123)).toBe(false);
    });

    it("should return false for DOMException without the symbol", () => {
      const domEx = new DOMException("msg", "type");

      expect(isLifecycleInterrupt(domEx)).toBe(false);
    });
  });
});
