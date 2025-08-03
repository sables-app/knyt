/// <reference types="bun-types" />

import path from "node:path";

import {
  pathAttributesByTagName,
  ResourceTag,
  resourceTagSelector,
} from "./importTags";

/**
 * Rewrites resource tag paths in an HTML string to absolute paths
 * based on given resource names.
 *
 * @param htmlText The HTML text to transform
 * @param resourceBaseNames An array of resource base names to match against the src attributes
 *
 * @internal
 */
export function rewriteRelativeResourceTags(
  htmlText: string,
  resourceBaseNames: string[],
  pathPrefix: string = "/",
): string {
  const rewriter = new HTMLRewriter().on(resourceTagSelector, {
    async element(element: HTMLRewriterTypes.Element) {
      const tagName = element.tagName.toLowerCase() as ResourceTag;
      const pathAttributes = pathAttributesByTagName[tagName];

      let src: string | null = null;
      let attributeName: string | undefined;

      for (const pathAttributeName of pathAttributes) {
        attributeName = pathAttributeName.toLowerCase();
        src = element.getAttribute(attributeName);

        if (src) break;
      }

      if (src === null || attributeName === undefined) {
        // Skip the tag if it doesn't have any of the src attributes
        // and it's not an import that needs to be forced.
        return;
      }

      const matchingResource = resourceBaseNames.find((resource) => {
        // Only match if the src attribute is a relative path
        // that begins with `./` and matches the resource file name.
        return src === `./${resource}`;
      });

      if (matchingResource === undefined) {
        // If the src attribute does not match any resource file name, we don't rewrite it.
        return;
      }

      element.setAttribute(
        attributeName,
        generateFinalPath(pathPrefix, matchingResource),
      );
    },
  });

  return rewriter.transform(htmlText);
}

/**
 * Regular expression to match web protocols.
 */
const webAddressRegex = /^[a-zA-Z+.-]+?:\/\//;

function isWebAddress(path: string): boolean {
  return webAddressRegex.test(path);
}

function generateFinalPath(
  pathPrefix: string,
  matchingResource: string,
): string {
  if (isWebAddress(pathPrefix)) {
    const url = new URL(pathPrefix);

    url.pathname = path.resolve(url.pathname, matchingResource);

    return url.href;
  }

  return path.resolve("/", pathPrefix, matchingResource);
}
