/// <reference types="bun-types" />

import path from "node:path";

import {
  ImportTag,
  importTagSelector,
  isProcessingTag,
  pathAttributesByTagName,
} from "./importTags";
import {
  isRelativePathWithDotSlash,
  relativePathWithDotSlash,
} from "./relativePathWithDotSlash";

/**
 * Rewrites the src attributes of import tags in the HTML text.
 *
 * @param inputDir Absolute path to the directory of the input file
 * @param includePath Absolute path to the include file
 * @param htmlText The HTML text to transform
 * @returns The transformed HTML text
 *
 * @internal
 */
export function rewriteIncludePaths(
  inputDir: string,
  includePath: string,
  htmlText: string,
): string {
  const rewriter = new HTMLRewriter().on(importTagSelector, {
    async element(element: HTMLRewriterTypes.Element) {
      const tagName = element.tagName.toLowerCase() as ImportTag;
      const shouldForceImport = isProcessingTag(element.tagName);
      const pathAttributes = pathAttributesByTagName[tagName];

      let src: string | null = null;
      let attributeName: string | undefined;

      for (const pathAttributeName of pathAttributes) {
        attributeName = pathAttributeName.toLowerCase();
        src = element.getAttribute(attributeName);

        if (src) break;
      }

      if (src === null || attributeName === undefined) {
        if (!shouldForceImport) {
          // Skip the tag if it doesn't have any of the src attributes
          // and it's not an import that needs to be forced.
          return;
        }

        throw new Error(
          `Missing ${pathAttributes} attribute(s) in <${tagName}> tag.`,
        );
      }

      let resolvedSrc: string;
      let nextSrc: string;

      // Only rewrite the src attribute if it is a relative path
      // that begins with `./` or `../`.
      if (isRelativePathWithDotSlash(src)) {
        resolvedSrc = path.resolve(path.dirname(includePath), src);
        nextSrc = relativePathWithDotSlash(inputDir, resolvedSrc);
      } else {
        // If the src attribute is not a relative path, we don't rewrite it.
        // We will just assume that the path is either an absolute path,
        // or a module path that can be resolved.
        resolvedSrc = src;
        nextSrc = src;
      }

      if (
        shouldForceImport ||
        // Only rewrite the src attribute if the module can be resolved.
        // Otherwise, don't rewrite it to avoid breaking the import.
        rewriteIncludePaths._moduleExists(resolvedSrc)
      ) {
        if (src !== nextSrc) {
          element.setAttribute(attributeName, nextSrc);
        }
      }
    },
  });

  return rewriter.transform(htmlText);
}

export namespace rewriteIncludePaths {
  /**
   * @internal
   */
  /*
   * ### Private Remarks
   *
   * This is only exposed for testing purposes.
   */
  export function _moduleExists(modulePath: string): boolean {
    try {
      // This could be `require.resolve` or `import.meta.resolve`,
      // but it's just a preference to use Bun's resolver API instead.
      Bun.resolveSync(modulePath, import.meta.dir);
      return true;
    } catch {
      return false;
    }
  }
}
