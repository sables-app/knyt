import type { HTMLElements } from "../generated/HTMLElements";

// HTMLElementTagNameMap
/**
 * Infers the tag name string literal type from the
 * `HTMLElementTagNameMap` type using a given element type.
 */
type TagNameFromElement<T> = T extends HTMLElement
  ? {
      [K in keyof HTMLElementTagNameMap]: HTMLElementTagNameMap[K] extends T
        ? K
        : never;
    }[keyof HTMLElementTagNameMap]
  : never;

// Example usage:
type DivTagName = TagNameFromElement<HTMLDivElement>; // "div"
type SpanTagName = TagNameFromElement<HTMLSpanElement>; // "span"
type TableRowTagName = TagNameFromElement<HTMLTableRowElement>; // "span"

export type InferAttributes<T> = HTMLElements[TagNameFromElement<T>];

// Example usage:
type DivAttributes = InferAttributes<HTMLDivElement>;
type SpanAttributes = InferAttributes<HTMLSpanElement>;
type TableRowAttributes = InferAttributes<HTMLTableRowElement>;
