import { createRequestState } from "./RequestState";

/**
 * Table of contents for the MDX document.
 *
 * @remarks
 *
 * If you are using the `remark-flexible-toc` and
 * `remark-mdx-flexible-toc` plugins, this will be populated
 * an array of table of contents items.
 *
 * @see import("remark-flexible-toc").TocItem
 */
/*
 * ### Private Remarks
 *
 * This type is intentionally left as `Record<string, unknown>[]`
 * to avoid adding a direct dependency on the `remark-flexible-toc`
 * and `remark-mdx-flexible-toc` plugins.
 *
 * Like the `frontmatter` property, anything could be used
 * to populate this property, so we leave it as a generic type.
 *
 * I don't find it much of a problem to have have to reference
 * the actual `TocItem` type in the code that uses this property.
 */
export type TocValue = ReadonlyArray<Record<string, unknown>>;

export namespace TocValue {
  export type Any = ReadonlyArray<Record<string, any>>;
}

/**
 * @internal scope: package
 */
export const tocState = createRequestState<TocValue.Any>([]);

export function getToc<T extends TocValue.Any = TocValue>(request: Request): T {
  return tocState.from(request) as T;
}

export {
  // Provide an alias, because readability is important.
  getToc as getTableOfContents,
};
