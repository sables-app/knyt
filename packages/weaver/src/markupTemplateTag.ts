import { renderAttributes } from "./render/mod.ts";
import type { MarkupTemplateTag, StringDocumentFragment } from "./types/mod.ts";
import {
  createFragmentDeclarationFromMarkup,
  createUnescapedString,
  isKnytContent,
} from "./utils/mod.ts";

export const markupTemplateTag = function markupTemplateTag(markup, ...values) {
  const resolvedValues = values.map((value): StringDocumentFragment.Value => {
    if (isKnytContent(value)) {
      return value;
    }

    return createUnescapedString(renderAttributes(value).join(" "));
  });

  return createFragmentDeclarationFromMarkup(markup, resolvedValues);
} satisfies MarkupTemplateTag;
