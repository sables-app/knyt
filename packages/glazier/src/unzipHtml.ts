/**
 * Unzips HTML text by splitting it into markup and parsed tags.
 * This is useful for extracting slot tags from HTML strings.
 *
 * @internal scope: workspace
 */
/*
 * ### Private Remarks
 *
 * This function a limitation that the tag's attributes must not
 * contain a greater-than character (`>`). This is because the function's
 * pattern relies on the greater-than character to denote the end of an
 * tag to split the HTML. This isn't an issue in practice, but this could
 * be migrated to use `HTMLRewriter` in the future to safely replace the tags,
 * then split the HTML.
 */
export function unzipHtml(tag: string, htmlText: string): unzipHtml.Result {
  const tagRegex = new RegExp(`(<${tag}[^>]*>|</${tag}>)`, "gi");
  const pieces = htmlText.split(tagRegex);

  const markup: string[] = [];
  const tags: unzipHtml.Tag[] = [];

  let isInsideSlotTag = false;

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    /** @example "<knyt-slot>" "</knyt-slot>" '<knyt-slot name="default">' */
    const trimmedPiece = piece.trim();
    const isSlotTag =
      trimmedPiece.startsWith(`<${tag}`) || trimmedPiece.startsWith(`</${tag}`);

    const isIndexEven = i % 2 === 0;

    if (!isSlotTag) {
      if (!isInsideSlotTag) {
        markup.push(trimmedPiece);
      }
      continue;
    }

    if (isIndexEven) {
      // If the index is even, we need to add an empty string
      // to the markup array so that the markup and slot tags
      // can be zipped back together correctly.
      markup.push("");
    }

    /** @example "knyt-slot" "/knyt-slot" 'knyt-slot name="default"' */
    const tagContents = trimmedPiece.slice(1, -1).trim();
    const isSlotEndTag = tagContents.startsWith("/");

    if (isSlotEndTag) {
      isInsideSlotTag = false;
      continue;
    }
    if (isInsideSlotTag) {
      throw new Error(`Nested <${tag}> tags are not allowed.`);
    }

    isInsideSlotTag = true;

    tags.push(parseStartTag(tagContents));
  }

  return { markup, tags };
}

export namespace unzipHtml {
  export type Attributes = Partial<Record<string, string | boolean>>;

  export type Tag = {
    tagName: string;
    attributes: Attributes;
  };

  export type Result = {
    markup: string[];
    tags: Tag[];
  };
}

/**
 * Parses the start tag of a slot tag and returns the tag name and attributes.
 *
 * @param tagContents `"knyt-slot" "/knyt-slot" 'knyt-slot name="default"'`
 */
function parseStartTag(tagContents: string): unzipHtml.Tag {
  const hasAttributes = tagContents.includes(" ");

  if (!hasAttributes) {
    return {
      tagName: tagContents,
      attributes: {
        name: "default",
      },
    };
  }

  const tagName = tagContents.slice(0, tagContents.indexOf(" "));

  /** @example 'name="default" foo' */
  const attrsString = tagContents.slice(tagContents.indexOf(" ") + 1).trim();
  /** @example ['name="   bar "', "foo"] */
  const attrSubstrings = attrsString.match(/([a-zA-Z0-9]+(="[^"]+")?)/g) ?? [];

  const attributes = attrSubstrings.reduce<unzipHtml.Attributes>(
    (result, substring) => {
      const hasStringValue = substring.includes("=");
      const attributeName = hasStringValue
        ? substring.slice(0, substring.indexOf("="))
        : substring;
      const value = hasStringValue
        ? substring.slice(substring.indexOf("=") + 2, -1)
        : true;

      result[attributeName] = value;

      return result;
    },
    {},
  );

  return {
    tagName,
    attributes,
  };
}
