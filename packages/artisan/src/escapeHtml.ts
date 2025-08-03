const htmlSpecialChars = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
  "/": "&#x2F;",
  // Unicode control characters
  "\u2028": "&#8232;",
  "\u2029": "&#8233;",
  "\u200B": "&#8203;",
  "\u200C": "&#8204;",
  "\u200D": "&#8205;",
  "\u200E": "&#8206;",
  "\u200F": "&#8207;",
  "\u2060": "&#8288;",
  "\u2061": "&#8289;",
  "\u2062": "&#8290;",
  "\u2063": "&#8291;",
  "\u2064": "&#8292;",
});

const attributeSpecialChars = Object.freeze({
  // Escape the required characters for HTML attributes
  "&": "&amp;",
  '"': "&quot;",
  // We're escaping the greater than and less than symbols here,
  // as they are often used to split HTML strings. We can avoid potential
  // issues with HTML parsing by escaping them.
  "<": "&lt;",
  ">": "&gt;",
});

const htmlEscapePatterns = createPatterns(htmlSpecialChars);
const attributeEscapePatterns = createPatterns(attributeSpecialChars);

/**
 * A pattern that matches invalid characters in HTML attribute names.
 *
 * @remarks
 *
 * Characters recognized in HTML attribute names include:
 *
 * - Case insensitive ASCII letters (a-z, A-Z)
 * - Digits (0-9)
 * - Hyphen (-)
 * - Underscore (_)
 * - Colon (:)
 * - Period (.)
 */
const invalidAttributeNameCharacters = /[^a-zA-Z0-9-_:.]/g;

const prototypePollutionKeys = Object.freeze([
  "__proto__",
  "constructor",
  "prototype",
  "toString",
  "valueOf",
]);

/**
 * Escapes special characters in a string to prevent XSS attacks.
 *
 * @internal scope: workspace
 */
export function escapeHtml(value: string): string {
  return escapeString(htmlEscapePatterns, value);
}

/**
 * Escapes special characters in a string for use in HTML attributes.
 *
 * @internal scope: workspace
 */
export function escapeAttributeValue(value: string): string {
  return escapeString(attributeEscapePatterns, value);
}

/**
 * Sanitizes an HTML attribute name by removing invalid characters.
 *
 * @remarks
 *
 * Characters recognized in HTML attribute names include:
 *
 * - Case insensitive ASCII letters (a-z, A-Z)
 * - Digits (0-9)
 * - Hyphen (-)
 * - Underscore (_)
 * - Colon (:)
 * - Period (.)
 *
 * @internal scope: workspace
 */
export function sanitizeAttributeName(name: string): string {
  // Remove invalid characters from the attribute name
  return name.replace(invalidAttributeNameCharacters, "");
}

type Patterns = (readonly [RegExp, string])[];

function createPatterns(strMap: Record<string, string>): Patterns {
  return Object.entries(strMap).map(
    ([specialCharacter, htmlEntity]) =>
      [new RegExp(specialCharacter, "g"), htmlEntity] as const,
  );
}

function escapeString(patterns: Patterns, value: string): string {
  let nextValue = value;

  for (const [pattern, htmlEntity] of patterns) {
    // `replace` is faster than `replaceAll`,
    // especially in cases where the pattern
    // is not created dynamically.
    nextValue = nextValue.replace(pattern, htmlEntity);
  }

  return nextValue;
}

/**
 * Serializes an object to a JSON string.
 *
 * @internal scope: workspace
 */
export function serializeData(state: unknown): string {
  const result = JSON.stringify(state, (key, value) => {
    if (prototypePollutionKeys.includes(key)) {
      // Block prototype pollution
      return undefined;
    }

    return value;
  });

  if (result === undefined) {
    throw new Error("Unsupported data type for serialization");
  }

  return result;
}

/**
 * Parses a JSON string into an object.
 *
 * @internal scope: workspace
 */
export function parseData<T = unknown>(serialized: string): T {
  try {
    return JSON.parse(serialized, (key, value) => {
      if (prototypePollutionKeys.includes(key)) {
        // Block prototype pollution
        return undefined;
      }

      return value;
    });
  } catch (parseError) {
    const error = new Error("Invalid JSON string");

    error.cause = parseError;

    throw error;
  }
}
