/**
 * A collection of common DOM property names that are expected to be reset by an empty string (`""`).
 */
const stringGuesses = [
  "id",
  "className",
  "title",
  "alt",
  "src",
  "href",
  "name",
  "type",
  "placeholder",
  "value",
];

/**
 * A collection of common DOM property names that are expected to be reset by `false`.
 */
const booleanGuesses = [
  "checked",
  "selected",
  "disabled",
  "hidden",
  "readonly",
  "multiple",
];

/**
 * A collection of common DOM property names that are expected to be reset by `0`.
 */
const numberGuesses = ["tabIndex", "minLength"];

/**
 * A dictionary of property names with special reset values that do not fit into the common categories.
 */
const specialGuesses: Record<string, string | boolean | number> = {
  maxLength: -1,
};

/**
 * Attempts to guess a reasonable reset value for a property based on its name.
 */
function guessPropertyResetValueByPropertyName(
  propertyName: string,
): string | boolean | number | Error {
  if (stringGuesses.includes(propertyName)) {
    return "";
  }
  if (booleanGuesses.includes(propertyName)) {
    return false;
  }
  if (numberGuesses.includes(propertyName)) {
    return 0;
  }

  return new Error("No guess available");
}

function guessPropertyResetValueByPrevValue(
  prevValue: unknown,
): string | boolean | number | undefined {
  if (typeof prevValue === "string") {
    return "";
  }
  if (typeof prevValue === "boolean") {
    return false;
  }
  if (typeof prevValue === "number") {
    return 0;
  }
  return undefined;
}

/**
 * Attempts to guess a reasonable reset value for a property based on its property name and previous value.
 *
 * @remarks
 *
 * This function is used in the less common case where a property was previously set using Knyt Weaver,
 * but is not included in the next set of properties to be applied. As such, the property should be
 * reset to a default value. The property shouldn't be ignored, as that could lead to unexpected behavior.
 *
 * For example, if a custom element renders two different declarations based on a condition, and the condition
 * changes, properties that were set on the first declaration, but not the second, should be reset to a
 * reasonable default value to reset their state.
 *
 * In the example below, the `value` property is set to an empty string when switching from a text input
 * to a number input, to ensure that the `value` property is reset and does not retain the previous value.
 *
 * ```ts
 * return condition ? dom.input.type("text").value("Hello") : dom.input.type("number");
 * ```
 */
export function guessPropertyResetValue(
  prevProps: Record<string, unknown> | undefined,
  propertyName: string,
): string | boolean | number | undefined {
  // Check for special cases first
  if (propertyName in specialGuesses) {
    return specialGuesses[propertyName];
  }

  // Second, attempt to guess based on property name second
  const guessByName = guessPropertyResetValueByPropertyName(propertyName);

  if (!(guessByName instanceof Error)) {
    return guessByName;
  }

  // TODO: Consider adding a warning message here in development mode

  if (prevProps && Object.hasOwn(prevProps, propertyName)) {
    // Third, attempt to guess based on previous value
    return guessPropertyResetValueByPrevValue(prevProps[propertyName]);
  }

  // If all else fails, return undefined
  return undefined;
}
