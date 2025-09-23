/// <reference types="bun-types" />

import path from "node:path";

import {
  isCustomElementConstructor,
  isNonNullableObject,
  type CustomElementConstructor,
  type DOMAttributeValue,
} from "@knyt/artisan";
import {
  type ElementDefinition,
  type PropertiesDefinition,
} from "@knyt/luthier";
import {
  createDOMBuilder,
  type ElementBuilder,
  type KnytDeclaration,
  type View,
} from "@knyt/weaver";

import { isVerboseEnv } from "../env";
import { getDocumentFrontmatter } from "../getDocumentFrontmatter";
import {
  DEFAULT_SLOT_NAME,
  replaceSlotTagsInHtml,
  resolveSlotName,
  unzipHtmlSlots,
  type SlotChildren,
} from "../htmlSlots";
import { hasSlotTag, KnytTagName, ProcessingTag } from "../importTags";
import { isRelativePathWithDotSlash } from "../relativePathWithDotSlash";
import type { TocValue } from "../RequestState/mod";
import { rewriteIncludePaths } from "../rewriteIncludePaths";
import type { GetRequestProps, IncludeOptions } from "../types";

// Banned globals
declare const customElements: never;
declare const document: never;
declare const window: never;

const MDX_CONTENT_FN_NAME = "MDXContent";

type MDXContentFn = {
  (props: Record<string, unknown>): KnytDeclaration;
  readonly name: typeof MDX_CONTENT_FN_NAME;
};

type Renderer =
  | View.Fn<Record<string, unknown>>
  | ElementDefinition.Fn<Record<string, unknown>>
  | MDXContentFn
  | CustomElementConstructor;

/**
 * @internal scope: workspace
 */
type RendererModule = {
  default: Renderer;
  getRequestProps?: GetRequestProps;
  properties?: PropertiesDefinition<any>;
  options?: IncludeOptions;
};

type MdxModule = {
  /**
   * The default export is a function that returns a Knyt declaration
   * that renders the MDX content.
   */
  default: MDXContentFn;
  /**
   * Frontmatter for the MDX document.
   *
   * @remarks
   *
   * This is typically populated by the `remark-frontmatter`
   * and `remark-mdx-frontmatter` plugins.
   *
   * It can contain any data that is relevant to the MDX document,
   * such as title, description, author, etc.
   */
  frontmatter?: Record<string, unknown>;
  /**
   * Table of contents for the MDX document.
   *
   * @remarks
   *
   * If you are using the `remark-flexible-toc` and
   * `remark-mdx-flexible-toc` plugins, this will be populated
   * an array of table of contents items.
   */
  toc?: TocValue;
};

export type BunHTMLBundleModule = {
  default: Bun.HTMLBundle;
};

export type RendererInclude = {
  getRequestProps: GetRequestProps | undefined;
  modulePath: string;
  properties: PropertiesDefinition<any> | undefined;
  renderer: Renderer;
  serverOnly: boolean | undefined;
  toc: TocValue | undefined;
};

export type Include = RendererInclude | Bun.HTMLBundle;

/**
 * Extracts props for a renderer from the attributes of an include element.
 *
 * @remarks
 *
 * This function looks for attributes that start with `data-` and
 * maps them to the corresponding properties defined in the `properties`
 * object. The `attributeName` property of each property definition
 * is used to match the attribute name, and the `toPropertyValue`
 * function is used to convert the attribute value to the appropriate
 * type.
 *
 * The attributes are prefixed with `data-` to avoid conflicts with
 * standard HTML attributes, and reserves the use of any unprefixed
 * attributes for plugin-specific use.
 */
export function getPropsFromAttributes(
  includeElement: HTMLRewriterTypes.Element,
  properties: PropertiesDefinition<any> | undefined,
) {
  if (!properties) return {};

  const props: Record<string, unknown> = {};

  for (const [propName, propDef] of Object.entries(properties)) {
    const attributeName = propDef?.attributeName;

    if (!attributeName) continue;

    const attributeValue = includeElement.getAttribute(`data-${attributeName}`);

    if (attributeValue === null) continue;

    props[propName] = propDef?.toPropertyValue
      ? propDef.toPropertyValue(attributeValue)
      : attributeValue;
  }

  return props;
}

export function isBunHTMLBundle(value: unknown): value is Bun.HTMLBundle {
  return (
    isNonNullableObject(value) &&
    "index" in value &&
    typeof value.index === "string"
  );
}

/**
 * Checks whether the value is a valid Bun HTML bundle module.
 *
 * @internal scope: workspace
 */
export function isBunHTMLBundleModule(
  value: unknown,
): value is BunHTMLBundleModule {
  return (
    isNonNullableObject(value) &&
    "default" in value &&
    isBunHTMLBundle(value.default)
  );
}

/**
 * Asserts that the value is a valid Bun HTML bundle module.
 *
 * @throws {TypeError} If the value is not a valid Bun HTML bundle module.
 * @internal scope: workspace
 */
export function assertBunHTMLBundleModule(
  value: unknown,
): asserts value is BunHTMLBundleModule {
  if (!isBunHTMLBundleModule(value)) {
    throw new TypeError(
      `Invalid HTML bundle import. Make sure the import path is an HTML file.`,
    );
  }
}

function isMdxModule(value: unknown): value is MdxModule {
  return isRendererModule(value) && isMDXContentFn(value.default);
}

function isRendererModule(value: unknown): value is RendererModule {
  return (
    isNonNullableObject(value) &&
    "default" in value &&
    typeof value.default === "function"
  );
}

export function isRendererInclude(value: unknown): value is RendererInclude {
  return (
    isNonNullableObject(value) &&
    "renderer" in value &&
    typeof value.renderer === "function" &&
    "properties" in value &&
    (typeof value.properties === "undefined" ||
      isNonNullableObject(value.properties))
  );
}

function mdxModuleToInclude(
  modulePath: string,
  input: MdxModule,
): RendererInclude {
  const { default: renderer, frontmatter, toc } = input;

  // Even though most markdown documents are static, MDX documents
  // typically contain dynamic content, such as custom elements,
  // so they are NOT server-only by default.
  //
  // This is for consistency with the renderer modules,
  // and to avoid tedious configuration of every MDX document
  // that is not server-only.
  //
  // This can be overridden by setting `serverOnly` to `true`
  // in the frontmatter of the MDX document.
  //
  // TODO: Add a way to configure this behavior globally,
  // TODO: See if there's a reliable way to detect if the MDX document
  // is likely to be server-only or not; preferably without rendering it.
  const serverOnly =
    typeof frontmatter?.serverOnly === "boolean"
      ? frontmatter.serverOnly
      : false;

  return {
    getRequestProps: undefined,
    modulePath,
    properties: undefined,
    renderer,
    serverOnly,
    toc,
  };
}

function rendererModuleToInclude(
  modulePath: string,
  input: RendererModule,
): RendererInclude {
  const { default: renderer, properties, options, getRequestProps } = input;

  if (typeof renderer !== "function") {
    throw new Error(
      `Renderer not found in ${modulePath}. Ensure a renderer is exported as the default export.`,
    );
  }

  return {
    getRequestProps,
    modulePath,
    properties,
    renderer,
    serverOnly: options?.serverOnly,
    toc: undefined,
  };
}

export async function importInclude(
  inputPath: string,
  includeElement: HTMLRewriterTypes.Element,
): Promise<Include> {
  const src = includeElement.getAttribute("src");

  if (!src) {
    throw new Error(
      `Missing src attribute in <${ProcessingTag.Include}> tag in ${inputPath}.`,
    );
  }

  const modulePath = isRelativePathWithDotSlash(src)
    ? path.resolve(path.dirname(inputPath), src)
    : src;

  let importedModule: unknown;

  try {
    importedModule = await import(modulePath);
  } catch (error) {
    console.error(error);

    throw new Error(
      `[Glazier] Failed to import module at: "${modulePath}".\nImported from: "${inputPath}".\n`,
    );
  }

  if (isBunHTMLBundleModule(importedModule)) {
    return importedModule.default;
  }
  if (isMdxModule(importedModule)) {
    return mdxModuleToInclude(modulePath, importedModule);
  }
  if (isRendererModule(importedModule)) {
    return rendererModuleToInclude(modulePath, importedModule);
  }
  if (isVerboseEnv()) {
    console.debug(importedModule);
  }

  throw new Error(
    `[Glazier] Invalid module type.

  Failed to recognize module at: "${modulePath}"
  Imported from: "${inputPath}"

  Make sure the "src" attribute points to a valid module recognized by Glazier.

  Supported module types are:
    - Bun HTML bundle module (Bun.HTMLBundle)
    - MDX module (with a default export of type MDXContentFn)
    - Renderer module (with a default export of type Renderer)
`,
  );
}

function htmlHasDoctype(html: string): boolean {
  return html.trimStart().slice(0, 9).toLowerCase().startsWith("<!doctype");
}

/**
 * @internal scope: package
 */
export function isMDXContentFn(renderer: unknown): renderer is MDXContentFn {
  return (
    typeof renderer === "function" && renderer.name === MDX_CONTENT_FN_NAME
  );
}

type RenderRendererIncludeOptions = {
  customElements?: CustomElementRegistry;
};

function renderCustomElement(
  ElementConstructor: CustomElementConstructor,
  props: Record<string, unknown>,
  children: ElementBuilder.ChildrenInput,
  options: RenderRendererIncludeOptions,
) {
  // TODO: Extract this to an environment utility package
  const $customElements = options.customElements ?? globalThis.customElements;

  if (typeof $customElements === "undefined") {
    throw new Error(
      "`customElements` is not available in the current environment. This likely means Knyt Glazier has not been properly initialized.",
    );
  }

  const tagName = $customElements.getName(ElementConstructor);

  if (!tagName) {
    throw new Error(
      `Custom element ${ElementConstructor.name} is not registered in the custom elements registry.`,
    );
  }

  return createDOMBuilder(tagName)
    .$props(props)
    .$children(...children);
}

/**
 * @internal scope: package
 */
export function renderRendererInclude(
  renderer: Renderer,
  props: Record<string, unknown>,
  children: ElementBuilder.ChildrenInput,
  options: RenderRendererIncludeOptions = {},
): KnytDeclaration {
  if (isMDXContentFn(renderer)) {
    return renderer({ ...props, children });
  }
  if (isCustomElementConstructor(renderer)) {
    return renderCustomElement(renderer, props, children, options);
  }

  return renderer()
    .$props(props)
    .$children(...children);
}

function prependFrontmatterSrcTag(html: string, src: string | undefined) {
  if (!src) return html;

  const tag = `<${KnytTagName.Frontmatter} src="${src}"></${KnytTagName.Frontmatter}>`;

  return `${tag}\n${html}`;
}

/**
 * Prepares the HTML for transformation by rewriting
 * the includes and replacing top-level the slot tags.
 */
export async function prepareHtmlForTransformation({
  htmlText,
  includePath,
  inputDir,
  slotChildren,
  frontmatterSrc,
}: {
  htmlText: string;
  includePath: string;
  // This should typically be either `path.dirname(doc.htmlPath)` or `options.dest`
  inputDir: string;
  slotChildren?: SlotChildren;
  frontmatterSrc: string;
}) {
  let resultHtml = htmlText;

  resultHtml = await replaceSlotTagsInHtml(resultHtml, slotChildren);
  resultHtml = await rewriteIncludePaths(inputDir, includePath, resultHtml);
  resultHtml = await prependFrontmatterSrcTag(resultHtml, frontmatterSrc);

  return resultHtml;
}

export async function interpolateInclude(
  includeElement: HTMLRewriterTypes.Element,
  renderedIncludeHtml: string,
): Promise<void> {
  if (!hasSlotTag(renderedIncludeHtml)) {
    // Just replace the HTML without further processing
    includeElement.replace(renderedIncludeHtml, { html: true });
    return;
  }

  const { markup, tags } = unzipHtmlSlots(renderedIncludeHtml);

  if (tags.length !== 1) {
    throw new Error(
      "Currently, only one <knyt-slot> tag is supported per HTML file.",
    );
  }

  const slotName = resolveSlotName(tags[0].attributes.name);

  if (slotName !== DEFAULT_SLOT_NAME) {
    throw new Error(
      `Currently, only the default slot is supported. Found "${slotName}".`,
    );
  }

  if (markup.length !== 2) {
    throw new Error("Invalid  markup: expected two pieces of markup.");
  }

  const [beforeSlot, afterSlot] = markup;

  includeElement
    .before(beforeSlot, { html: true })
    .after(afterSlot, { html: true })
    .removeAndKeepContent();
}

export function parseEnvAttributeValue(
  attrValue: DOMAttributeValue,
): string[] | null {
  if (!attrValue) return null;

  return attrValue.split(",").map((env) => env.trim());
}

export async function normalizeFrontmatter(
  src: string | undefined,
  text: string[],
): Promise<Record<string, unknown> | undefined> {
  if (src) {
    return getDocumentFrontmatter(src);
  }

  if (text.length === 0) {
    return undefined;
  }

  // TODO: Add support for TOML for feature parity with other plugins.
  // Currently, we only support YAML.
  return Bun.YAML.parse(text.join("\n")) as Record<string, unknown>;
}
