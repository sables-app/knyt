import { renderCSS, type StyleObject } from "@knyt/weaver";

import { hashString } from "./hashString";
import type { SerializedCSSObject } from "./types";

const EMPTY_STYLE_HASH = "-noop";

// Banned globals
declare const document: never;
declare const window: never;

function isEmptyStyleObject(obj: StyleObject): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Serializes a CSS object into a hash and a CSS declaration block
 */
/*
 * ### Private Remarks
 *
 * This function abstracts the serialization of a CSS object to provide
 * a consistent and more description interface for serializing CSS objects.
 */
export function serializeCSSObject(
  $document: Document,
  cssObject: StyleObject,
): SerializedCSSObject {
  if (isEmptyStyleObject(cssObject)) {
    return {
      declarationBlock: "",
      hash: EMPTY_STYLE_HASH,
    };
  }

  const declarationBlock = renderCSS($document, cssObject);
  const hash = hashString(declarationBlock);

  return {
    declarationBlock,
    hash,
  };
}
