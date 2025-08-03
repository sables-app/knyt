import { renderAttributes } from "./render/mod";
import type { MarkupTemplateTag, StringDocumentFragment } from "./types/mod";
import {
  createFragmentDeclarationFromMarkup,
  createUnescapedString,
  isKnytContent,
} from "./utils/mod";

export const markupTemplateTag = function markupTemplateTag(markup, ...values) {
  const resolvedValues = values.map((value): StringDocumentFragment.Value => {
    if (isKnytContent(value)) {
      return value;
    }

    return createUnescapedString(renderAttributes(value).join(" "));
  });

  return createFragmentDeclarationFromMarkup(markup, resolvedValues);
} satisfies MarkupTemplateTag;
