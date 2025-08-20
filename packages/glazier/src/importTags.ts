export enum KnytTagName {
  /**
   * The frontmatter tag is used to define metadata for the document.
   * It is typically used to specify the title, author, date, and other
   * information about the document.
   *
   * @remarks
   *
   * ### Attributes
   *
   * - `src`: Optional. The path to the file to extract frontmatter from.\
   *     - The extracted data can be accessed using the `getFrontmatter`
   *       function. If provided, the tag shouldn't contain any content.
   *
   * ### Content
   *
   * If the `src` attribute is not provided, the tag should contain a YAML
   * object as its content. The YAML object is parsed and associated
   * with the incoming request. The parsed data can be accessed using the
   * `getFrontmatter` function.
   *
   * @see https://github.com/remarkjs/remark-frontmatter?tab=readme-ov-file#examples
   */
  /*
   * ### Private Remarks
   *
   * The tag is named "frontmatter" to indicate that it is used to define
   * metadata for the document. The name is derived from the concept of
   * "front matter" in static site generators, where metadata is defined
   * at the beginning of a document.
   *
   * Additionally, the tags are technically valid frontmatter boundaries,
   * even though they are non-standard.
   */
  Frontmatter = "knyt-frontmatter",
  /**
   * A tag that is used to include additional content into the document.
   *
   * @remarks
   *
   * The include tag can be used to include:
   * - HTML documents and fragments
   * - MDX documents
   *     - Requires the `@mdx-js/esbuild` plugin configured
   *       with `jsxImportSource` set to `"@knyt/weaver"`.
   * - Knyt documents
   *     - An Knyt document is a TS/JS module that exports
   *       either a `View` or `ElementDefinition`
   *
   * ### Attributes
   *
   * - `src`: Required. The path to the file to include.
   * - `data-[...]`: Optional. Any other data attributes are passed
   *       to the included file as props if the included
   *       file is a Knyt document with `properties` defined
   *       with matching attribute names.
   *       See `getPropsFromAttributes` for more details.
   *
   * ### Content
   *
   * The content of an include tag replaces the included content's
   * default slot tag if present.
   */
  Include = "knyt-include",
  /**
   * A tag that is used to define a slot in the document
   * for interpolation.
   *
   * @remarks
   *
   * ### Attributes
   *
   * - `name`: Optional. The name of the slot. If not provided,
   *           the slot will default to `default`.
   */
  Slot = "knyt-slot",
  /**
   * A tag that is used include content based on the
   * current environment.
   *
   * @remarks
   *
   * ### Attributes
   *
   * - `allow`: Optional. A comma-separated list of environments
   *            in which the content should be included.
   * - `disallow`: Optional. A comma-separated list of environments
   *               in which the content should not be included.
   */
  Env = "knyt-env",
}

export enum ProcessingTag {
  Frontmatter = KnytTagName.Frontmatter,
  Include = KnytTagName.Include,
  Env = KnytTagName.Env,
}

export enum ResourceTag {
  Script = "script",
  Link = "link",
  Img = "img",
  Video = "video",
  Audio = "audio",
  Source = "source",
  Iframe = "iframe",
}

export enum ImportTag {
  Include = KnytTagName.Include,
  Script = ResourceTag.Script,
  Link = ResourceTag.Link,
  Img = ResourceTag.Img,
  Video = ResourceTag.Video,
  Audio = ResourceTag.Audio,
  Source = ResourceTag.Source,
  Iframe = ResourceTag.Iframe,
}

const knytTagNames = Object.values(KnytTagName);
export const processingTagNames = Object.values(ProcessingTag);
export const processingTagSelector = processingTagNames.join(",");
const importTagNames = Object.values(ImportTag);
export const importTagSelector = importTagNames.join(",");
const resourceTagNames = Object.values(ResourceTag);
export const resourceTagSelector = resourceTagNames.join(",");

export const pathAttributesByTagName: Record<ImportTag, string[]> = {
  [ImportTag.Include]: ["src"],
  [ImportTag.Script]: ["src"],
  [ImportTag.Link]: ["href"],
  [ImportTag.Img]: ["src"],
  [ImportTag.Video]: ["src"],
  [ImportTag.Audio]: ["src"],
  [ImportTag.Source]: ["src", "srcset"],
  [ImportTag.Iframe]: ["src"],
};

export function isKnytTagName(tagName: string): tagName is KnytTagName {
  return knytTagNames.includes(tagName as KnytTagName);
}

export function isProcessingTag(tagName: string): tagName is ProcessingTag {
  return processingTagNames.includes(tagName as ProcessingTag);
}

/**
 * Determines if the HTML contains any of the given tag.
 */
export function hasHtmlTag(tag: string, htmlText: string): boolean {
  return hasSomeHtmlTags([tag], htmlText);
}

/**
 * Determines if the HTML contains any of the given tags.
 */
export function hasSomeHtmlTags(tagNames: string[], htmlText: string): boolean {
  let hasTag = false;
  // We're using HTMLRewriter to parse the HTML and check for tags.
  // This is a fast way to check for the presence of tags without using:
  // - a full HTML parser, which can be slow and heavy
  // - regex, which can be error-prone (think commented out code during development)
  let rewriter = new HTMLRewriter();

  for (const tag of tagNames) {
    rewriter = rewriter.on(tag, {
      element: () => {
        hasTag = true;
        // TODO: See if we can add a way to stop the rewriter
        // TODO: Contribute support for providing an abort signal???
        //
        // Throwing an error and catching it doesn't work, because the rewriter
        // just swallows the error and continues processing. Maybe that's a bug?
        //
        // It's fast enough though, so it doesn't really matter; micro optimization.
        // 0.01ms per search on average, on my machine.
      },
    });
  }

  rewriter.transform(htmlText);

  return hasTag;
}

/**
 * Determines if the HTML contains any recognized tags.
 */
export function hasUnprocessedTags(html: string): boolean {
  return hasSomeHtmlTags(processingTagNames, html);
}

/**
 * Determines if the HTML contains any of the given tag.
 */
export function hasKnytTag(tag: KnytTagName, htmlText: string): boolean {
  return hasHtmlTag(tag, htmlText);
}

export function hasSlotTag(htmlText: string): boolean {
  return hasKnytTag(KnytTagName.Slot, htmlText);
}

export function hasFrontmatterTag(htmlText: string): boolean {
  return hasKnytTag(KnytTagName.Frontmatter, htmlText);
}

export function hasEnvTag(htmlText: string): boolean {
  return hasKnytTag(KnytTagName.Env, htmlText);
}
