import { describe, expect, it } from "bun:test";

import {
  escapeAttributeValue,
  escapeHtml,
  parseData,
  sanitizeAttributeName,
  serializeData,
} from "../escapeHtml.ts";

describe("escapeHtml", () => {
  describe("escapeHtml", () => {
    it("escapes ampersands", () => {
      expect(escapeHtml("Fish & Chips")).toBe("Fish &amp; Chips");
    });

    it("escapes less-than signs", () => {
      expect(escapeHtml("5 < 10")).toBe("5 &lt; 10");
    });

    it("escapes greater-than signs", () => {
      expect(escapeHtml("10 > 5")).toBe("10 &gt; 5");
    });

    it("escapes double quotes", () => {
      expect(escapeHtml('He said "hello"')).toBe("He said &quot;hello&quot;");
    });

    it("escapes single quotes", () => {
      expect(escapeHtml("It's a test")).toBe("It&#39;s a test");
    });

    it("escapes backticks", () => {
      expect(escapeHtml("Template `string`")).toBe("Template &#96;string&#96;");
    });

    it("handles strings with multiple characters to escape", () => {
      expect(escapeHtml('<div class="test">Hello & Welcome</div>')).toBe(
        "&lt;div class=&quot;test&quot;&gt;Hello &amp; Welcome&lt;&#x2F;div&gt;",
      );
    });

    it("returns the same string if no characters need escaping", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
    });

    it("handles empty strings", () => {
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("escapeAttributeValue", () => {
    it("escapes ampersands", () => {
      expect(escapeAttributeValue("Fish & Chips")).toBe("Fish &amp; Chips");
    });

    it("escapes double quotes", () => {
      expect(escapeAttributeValue('He said "hello"')).toBe(
        "He said &quot;hello&quot;",
      );
    });

    it("escapes less-than and greater-than signs", () => {
      expect(escapeAttributeValue("<div>")).toBe("&lt;div&gt;");
    });

    it("returns the same string if no characters need escaping", () => {
      expect(escapeAttributeValue("Hello World")).toBe("Hello World");
    });

    it("handles empty strings", () => {
      expect(escapeAttributeValue("")).toBe("");
    });
  });

  describe("sanitizeAttributeName", () => {
    it("removes invalid characters from attribute names", () => {
      expect(sanitizeAttributeName("data-attr!@#$%^&*()</>")).toBe("data-attr");
    });

    it("allows valid attribute name characters", () => {
      expect(sanitizeAttributeName("data-ATTR_123:abc.def")).toBe(
        "data-ATTR_123:abc.def",
      );
    });

    it("handles attribute names with only invalid characters", () => {
      expect(sanitizeAttributeName("!@#$%^&*()</>")).toBe("");
    });

    it("returns the same string if no invalid characters are present", () => {
      expect(sanitizeAttributeName("valid-attr")).toBe("valid-attr");
    });

    it("maintains case sensitivity", () => {
      expect(sanitizeAttributeName("DATA-ATTR")).toBe("DATA-ATTR");
    });

    it("handles empty strings", () => {
      expect(sanitizeAttributeName("")).toBe("");
    });
  });

  describe("parseData", () => {
    it("parses a JSON string to an object", () => {
      const jsonString = '{"name":"Alice","age":30}';
      expect(parseData<any>(jsonString)).toEqual({ name: "Alice", age: 30 });
    });

    it("parses a JSON string to an array", () => {
      const jsonString = "[1,2,3]";
      expect(parseData<any>(jsonString)).toEqual([1, 2, 3]);
    });

    it("parses a JSON string to a string", () => {
      const jsonString = '"Hello World"';
      expect(parseData<any>(jsonString)).toBe("Hello World");
    });

    it("parses a JSON string to a number", () => {
      const jsonString = "42";
      expect(parseData<any>(jsonString)).toBe(42);
    });

    it("parses a JSON string to null", () => {
      const jsonString = "null";
      expect(parseData<any>(jsonString)).toBeNull();
    });

    it("throws an error for invalid JSON strings", () => {
      expect(() => parseData<any>("{name: 'Alice'}")).toThrow(
        "Invalid JSON string",
      );
    });

    describe("prototype pollution prevention", () => {
      it("removes prototype pollution keys during parsing", () => {
        const jsonString =
          '{"safe":"value","__proto__":"polluted","constructor":"polluted","prototype":"polluted","toString":"polluted","valueOf":"polluted"}';
        const parsed = parseData<any>(jsonString);

        expect(parsed).toEqual({ safe: "value" });
        expect(Object.hasOwn(parsed, "__proto__")).toBe(false);
        expect(Object.hasOwn(parsed, "constructor")).toBe(false);
        expect(Object.hasOwn(parsed, "prototype")).toBe(false);
        expect(Object.hasOwn(parsed, "toString")).toBe(false);
        expect(Object.hasOwn(parsed, "valueOf")).toBe(false);
      });

      it("removes prototype pollution keys from nested objects during parsing", () => {
        const jsonString =
          '{"nested":{"safe":"ok","__proto__":"polluted","constructor":"polluted"}}';
        const parsed = parseData<any>(jsonString);

        expect(parsed).toEqual({ nested: { safe: "ok" } });
        expect(Object.hasOwn(parsed.nested, "__proto__")).toBe(false);
        expect(Object.hasOwn(parsed.nested, "constructor")).toBe(false);
        expect(Object.hasOwn(parsed.nested, "prototype")).toBe(false);
        expect(Object.hasOwn(parsed.nested, "toString")).toBe(false);
        expect(Object.hasOwn(parsed.nested, "valueOf")).toBe(false);
      });

      it("does not allow prototype pollution via arrays", () => {
        const jsonString =
          '[1, 2, {"__proto__":"polluted"}, {"constructor":"polluted"}]';
        const parsed = parseData<any>(jsonString);

        expect(parsed[2]).toEqual({});
        expect(Object.hasOwn(parsed[2], "__proto__")).toBe(false);
        expect(Object.hasOwn(parsed[2], "constructor")).toBe(false);
        expect(Object.hasOwn(parsed[2], "prototype")).toBe(false);
        expect(Object.hasOwn(parsed[2], "toString")).toBe(false);
        expect(Object.hasOwn(parsed[2], "valueOf")).toBe(false);
        expect(parsed[3]).toEqual({});
        expect(Object.hasOwn(parsed[3], "__proto__")).toBe(false);
        expect(Object.hasOwn(parsed[3], "constructor")).toBe(false);
        expect(Object.hasOwn(parsed[3], "prototype")).toBe(false);
        expect(Object.hasOwn(parsed[3], "toString")).toBe(false);
        expect(Object.hasOwn(parsed[3], "valueOf")).toBe(false);
      });
    });
  });

  describe("serializeData", () => {
    it("serializes a simple object to JSON", () => {
      const data = { name: "Alice", age: 30 };
      expect(serializeData(data)).toBe('{"name":"Alice","age":30}');
    });

    it("serializes an array to JSON", () => {
      const data = [1, 2, 3];
      expect(serializeData(data)).toBe("[1,2,3]");
    });

    it("serializes a string to JSON", () => {
      const data = "Hello World";
      expect(serializeData(data)).toBe('"Hello World"');
    });

    it("serializes a number to JSON", () => {
      const data = 42;
      expect(serializeData(data)).toBe("42");
    });

    it("serializes null to JSON", () => {
      const data = null;
      expect(serializeData(data)).toBe("null");
    });

    it("throws an error for unsupported types", () => {
      expect(() => serializeData(undefined as any)).toThrow(
        "Unsupported data type for serialization",
      );
    });

    describe("prototype pollution prevention", () => {
      it("removes prototype pollution keys during serialization", () => {
        const data = {
          safe: "value",
          __proto__: "polluted",
          constructor: "polluted",
          prototype: "polluted",
          toString: "polluted",
          valueOf: "polluted",
        };

        const json = serializeData(data);

        expect(json).toBe('{"safe":"value"}');
        expect(json).not.toContain("__proto__");
        expect(json).not.toContain("constructor");
        expect(json).not.toContain("prototype");
        expect(json).not.toContain("toString");
        expect(json).not.toContain("valueOf");
      });

      it("removes prototype pollution keys from nested objects during serialization", () => {
        const data = {
          nested: {
            __proto__: "polluted",
            safe: "ok",
          },
        };
        const json = serializeData(data);

        expect(json).toBe('{"nested":{"safe":"ok"}}');
      });
    });
  });
});
