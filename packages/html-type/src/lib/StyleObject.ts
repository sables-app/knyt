import type { Properties } from "csstype";

type CSSProperties = Properties<number | string, string>;

type CSSVariableName = `--${string}`;

type CSSVariables = Partial<Record<CSSVariableName, string | number>>;

/**
 * Represents a set of CSS properties that can be serialized to a string
 * or applied directly to an element's `style` property.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration
 */
/*
 * ### Private Remarks
 *
 * This base type is similar to `Partial<CSSStyleDeclaration>`, but this one:
 *
 * 1. is writable
 * 2. doesn't have an index type
 * 3. doesn't have iterator properties
 * 4. accepts numbers as values
 * 5. allows custom CSS variables
 */
export type StyleObject = CSSProperties & CSSVariables;
