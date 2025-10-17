/// <reference types="bun-types" />

import path from "node:path";

import { typeCheck } from "@knyt/artisan";
import { createHTMLBuilder, render, type RenderOptions } from "@knyt/weaver";
import type { BunRequest } from "bun";

import { createBunRequest } from "../createBunRequest.ts";
import { createPage, type Page } from "../domEnv.ts";
import { getSSREnv } from "../env.ts";
import { DEFAULT_SLOT_NAME } from "../htmlSlots.ts";
import {
  hasFrontmatterTag,
  hasUnprocessedTags,
  KnytTagName,
  ProcessingTag,
} from "../importTags.ts";
import { frontmatterState, tocState } from "../RequestState/mod.ts";
import { rewriteIncludePaths } from "../rewriteIncludePaths.ts";
import type { GetRequestProps, TransformerRenderOptions } from "../types.ts";
import type { GlazierPluginOptions } from "./GlazierPluginOptions.ts";
import {
  getPropsFromAttributes,
  importInclude,
  interpolateInclude,
  isBunHTMLBundle,
  isRendererInclude,
  normalizeFrontmatter,
  parseEnvAttributeValue,
  renderRendererInclude,
  type Include,
  type RendererInclude,
} from "./utils.ts";

// Banned globals
declare const customElements: never;
declare const document: never;
declare const window: never;

const KnytSlot = createHTMLBuilder<{ name?: string }>(KnytTagName.Slot);

declare global {
  interface HTMLElementTagNameMap {
    [KnytTagName.Slot]: HTMLElement;
  }
}

export const defaultRenderOptions: TransformerRenderOptions = {
  disableKeyAttributes: false,
  enableWhitespace: false,
  // An arbitrary timeout to wait for reactive elements
  // to be ready before rendering.
  // TODO: Test this value and adjust it if necessary.
  reactiveElementTimeout: 20,
};

/**
 * Options for module transformations
 *
 * @internal scope: package
 */
export type TransformOptions = GlazierPluginOptions & {
  /**
   * An external request to use for the transformation.
   * This can be used to pass a request object to renderer's getRequestProps.
   *
   * @internal scope: package
   */
  request?: BunRequest;
};

/**
 * @internal scope: workspace
 */
export type TransformResult = {
  /**
   * The request object that was used to transform the HTML.
   */
  request: BunRequest;
  /**
   * The path of the input HTML file.
   * This is the path that was passed to the transform function.
   * It is used to resolve relative paths in the HTML.
   */
  inputPath: string;
  /**
   * The transformed HTML.
   */
  html: string;
  /**
   * A list of module paths of renderer modules that were used
   * in the transformation.
   */
  rendererModulePaths: string[];
  /**
   * A list of include src values that were processed
   * in the transformation.
   */
  includesProcessed: string[];
};

/**
 * A transformer that can be used to transform HTML
 * with Knyt Includes.
 *
 * @internal scope: workspace
 */
export class Transformer {
  /**
   * The page used for the transformation.
   * The page is only created it's needed, i.e.
   * when rendering a renderer include.
   */
  #_page: Page | undefined;

  /**
   * Retrieves the page used for current transformation,
   * creating it if it doesn't exist.
   */
  get #page(): Page {
    if (!this.#_page) {
      this.#_page = createPage();
    }

    return this.#_page;
  }

  get #hasPage(): boolean {
    return !!this.#_page;
  }

  /**
   * A flag to indicate if the page has been closed.
   */
  #hasPageClosed = false;

  /**
   * Close the page to free up resources.
   *
   * @remarks
   *
   * Once the page is closed, it cannot be reopened,
   * and the transformer cannot be used again.
   */
  #closePage() {
    if (this.#hasPageClosed) return;

    this.#hasPageClosed = true;

    if (!this.#hasPage) return;

    // We don't need to wait for the page to close, since nothing depends on it.
    // We just want to clean up the resources.
    this.#page.browserPage.close().catch((error) => {
      console.error("Error closing browser:", error);
    });
  }

  #options: TransformOptions;
  #recursionCount = 0;
  #recursionLimit = 100;

  /**
   * A set of module paths of renderer modules
   * that have been included in the current transformation.
   *
   * @remarks
   *
   * This set exists so that we can create a virtual module
   * that loads all the custom elements that were used in the
   * transformation.
   *
   * However, every renderer must be included in this set
   * regardless of whether it was a template or a custom element,
   * because templates may import and use custom elements,
   * so they also need to be loaded to ensure that all custom
   * elements are loaded.
   */
  readonly #rendererModulePaths = new Set<string>();

  /**
   * A set of include src values that have been processed
   * in the transformer.
   *
   * @remarks
   *
   * This set exists to be able to later watch these files
   * for changes in a development environment.
   */
  readonly #includesProcessed = new Set<string>();

  constructor(options: TransformOptions) {
    this.#options = options;
  }

  get rendererModulePaths(): string[] {
    return [...this.#rendererModulePaths];
  }

  get includesProcessed(): string[] {
    return [...this.#includesProcessed];
  }

  #request: BunRequest | undefined;

  #demandMainInputPath(): string {
    if (!this.#mainInputPath) {
      throw new Error(
        "The main input path is not available until the transform method is called. This is a bug in the knyt plugin.",
      );
    }

    return this.#mainInputPath;
  }

  get request(): BunRequest {
    if (!this.#request) {
      const mainInputPath = this.#demandMainInputPath();

      this.#request =
        this.#options.request ?? createRequestFromInputPath(mainInputPath);
    }

    return this.#request;
  }

  async #getPropsFromFetcher(
    _inputPath: string,
    getRequestProps: GetRequestProps | undefined,
    inputProps: Record<string, unknown>,
  ): Promise<Record<string, unknown> | undefined> {
    const request = this.request;
    const modifiedRequest =
      (await this.#options.onRequest?.(request)) ?? request;
    const result = await getRequestProps?.(modifiedRequest, inputProps);

    const {
      props: propsFromFetcher,
      // Responses are not supported yet.
      // We keep it here for future use in server-side rendering,
      // but it has not use for static-site generation.
      response: _responseInit,
    } = result ?? {};

    return propsFromFetcher;
  }

  /**
   * Processes a <knyt-include> element, that's a renderer include,
   * and returns the next node to replace it with.
   */
  async #processRendererInclude(
    inputPath: string,
    includeElement: HTMLRewriterTypes.Element,
    include: RendererInclude,
  ): Promise<void> {
    const { getRequestProps, modulePath, renderer, properties } = include;

    if (!include.serverOnly) {
      this.#rendererModulePaths.add(modulePath);
    }
    if (include.toc) {
      tocState.associate(this.request, include.toc);
    }

    const propsFromAttributes = getPropsFromAttributes(
      includeElement,
      properties,
    );

    let propsFromFetcher: Record<string, unknown> | undefined;

    try {
      propsFromFetcher = await this.#getPropsFromFetcher(
        inputPath,
        getRequestProps,
        propsFromAttributes,
      );
    } catch (error) {
      console.error(`Error fetching props from ${inputPath}:`, error);
    }

    // Merge the props from the attributes and the props from the fetcher.
    // The `getRequestProps` function receives props derived from attributes`
    // when called, so it has the capability to override the props.
    const props = {
      ...propsFromAttributes,
      ...propsFromFetcher,
    };
    const children = [KnytSlot.name(DEFAULT_SLOT_NAME)];
    const declaration = renderRendererInclude(renderer, props, children);

    const externalRenderOptions: TransformerRenderOptions | undefined =
      await this.#options.onConfigureRender?.(inputPath);

    const renderOptions: RenderOptions = {
      ...defaultRenderOptions,
      ...externalRenderOptions,
      document: this.#page.$document,
    };

    let renderedIncludeHtml: string;

    try {
      renderedIncludeHtml = await render(declaration, renderOptions);
    } catch (error) {
      console.error(`Error rendering include from ${inputPath}:`, error);
      includeElement.remove();
      return;
    }

    // Rewrite includes in the rendered HTML to process any additional
    // <knyt-include>, <script>, <link>, or similar tags rendered by the renderer.
    renderedIncludeHtml = rewriteIncludePaths(
      path.dirname(inputPath),
      modulePath,
      renderedIncludeHtml,
    );

    await interpolateInclude(includeElement, renderedIncludeHtml);
  }

  /**
   * Processes a <knyt-include> element, that's a Bun HTML bundle,
   * and returns the next node to replace it with.
   */
  async #processBunHTMLBundleInclude(
    inputPath: string,
    includeElement: HTMLRewriterTypes.Element,
    include: Bun.HTMLBundle,
  ): Promise<void> {
    let htmlText = await Bun.file(include.index).text();

    htmlText = rewriteIncludePaths(
      path.dirname(inputPath),
      include.index,
      htmlText,
    );

    await interpolateInclude(includeElement, htmlText);
  }

  #hasProcessedFrontmatter = false;

  /**
   * The main entry point for the transformer.
   */
  #mainInputPath: string | undefined;

  /**
   * Transforms the input HTML by replacing all tags found in
   * the document that match `ProcessingTag` with the corresponding
   * processor.
   */
  async transform(inputPath: string, inputHtml: string): Promise<string> {
    if (this.#hasPageClosed) {
      throw new Error(
        "The transformer has already been used and the page has been closed.",
      );
    }

    if (!this.#mainInputPath) {
      this.#mainInputPath = inputPath;
    }

    this.#recursionCount++;

    if (this.#recursionCount > this.#recursionLimit) {
      throw new Error(
        `The transformer has been called ${this.#recursionLimit} times. This is likely an infinite loop.`,
      );
    }

    // If the input HTML does not contain any recognized tags,
    // we can return it as is and close the page.
    // This is a performance optimization to avoid unnecessary
    // processing of the HTML.
    if (!hasUnprocessedTags(inputHtml)) {
      this.#closePage();

      return inputHtml;
    }

    let hasEncounteredProcessingTag = false;

    const environment = getSSREnv();

    /**
     * The output HTML that will be returned after processing.
     * It starts as the input HTML and is transformed as we process
     * the <knyt-include> and other tags.
     */
    let outputHtml = inputHtml;

    // The frontmatter tag is handled separately from other tags
    // to ensure it is processed first, as it may contain metadata
    // that influences the handling of subsequent tags like <knyt-include>.
    //
    // We use a dedicated rewriter to extract and parse the frontmatter
    // before processing the rest of the document, so that its data
    // can be associated with the request as soon as it is available.
    if (hasFrontmatterTag(outputHtml)) {
      const frontmatterText: string[] = [];
      let frontmatterSrc: string | undefined;

      const frontmatterRewriter = new HTMLRewriter()
        // This tag should be the first Knyt tag matched in the document tree.
        .on(ProcessingTag.Frontmatter, {
          element: (frontmatterElement) => {
            const mainInputPath = this.#demandMainInputPath();

            let warningMessage: string | undefined;

            if (inputPath !== mainInputPath) {
              warningMessage = `The <${ProcessingTag.Frontmatter}> tag should be the first Knyt tag matched in the document tree to be valid. Other tags will be ignored.`;
            } else if (this.#hasProcessedFrontmatter) {
              warningMessage = `Multiple <${ProcessingTag.Frontmatter}> tags found in document tree resulting from ${inputPath}. Only the first one will be processed.`;
            } else if (hasEncounteredProcessingTag) {
              warningMessage = `The <${ProcessingTag.Frontmatter}> tag should be the first Knyt tag matched in the document tree to be valid. Other tags will be ignored.`;
            }

            this.#hasProcessedFrontmatter = true;
            hasEncounteredProcessingTag = true;

            if (warningMessage) {
              console.warn(warningMessage);
            } else {
              frontmatterSrc =
                frontmatterElement.getAttribute("src") ?? undefined;
            }

            frontmatterElement.remove();
          },
          text: (textChunk) => {
            frontmatterText.push(textChunk.text);
          },
        });

      // TypeScript is confused about the overload here for some reason.
      outputHtml = frontmatterRewriter.transform(outputHtml) as unknown as string;

      const parsedFrontmatter = await normalizeFrontmatter(
        frontmatterSrc,
        frontmatterText,
      );

      if (parsedFrontmatter) {
        frontmatterState.associate(this.request, parsedFrontmatter);
      }
    }

    // If the input HTML contains a <knyt-include> tag, we need to process it.
    {
      /**
       * Remove all comments except those that start with `@preserve`
       */
      function handleComments(comment: HTMLRewriterTypes.Comment): void {
        // Comments are meant for humans, so requiring `@preserve` to keep
        // them should be fine. I'd rather not add an option for this, because
        // machine-readable comments is a stupid idea in the first place.
        if (comment.text.trim().startsWith("@preserve") === false) {
          comment.remove();
        }
      }

      const otherTagsRewriter = new HTMLRewriter()
        .on(ProcessingTag.Env, {
          element: (envElement): void => {
            const allow = parseEnvAttributeValue(
              envElement.getAttribute("allow"),
            );
            const disallow = parseEnvAttributeValue(
              envElement.getAttribute("disallow"),
            );

            if (disallow && disallow.includes(environment)) {
              envElement.remove();
              return;
            }
            if (allow && !allow.includes(environment)) {
              envElement.remove();
              return;
            }

            envElement.removeAndKeepContent();
          },
        })
        .on(ProcessingTag.Include, {
          element: async (includeElement): Promise<void> => {
            let include: Include;

            const src = includeElement.getAttribute("src");

            if (!src) {
              console.error(
                `Missing src attribute in <${ProcessingTag.Include}> tag in ${inputPath}.`,
              );

              includeElement.remove();
              return;
            }

            try {
              include = await importInclude(inputPath, src);
            } catch (error) {
              console.error(`Error importing from ${inputPath}:`, error);

              includeElement.remove();
              return;
            }

            if (isRendererInclude(include)) {
              this.#includesProcessed.add(include.modulePath);

              try {
                await this.#processRendererInclude(
                  inputPath,
                  includeElement,
                  include,
                );
                return;
              } catch (error) {
                console.error(
                  `Error processing renderer include from ${inputPath}:`,
                  error,
                );

                includeElement.remove();
                return;
              }
            }

            if (isBunHTMLBundle(include)) {
              this.#includesProcessed.add(include.index);

              try {
                await this.#processBunHTMLBundleInclude(
                  inputPath,
                  includeElement,
                  include,
                );
                return;
              } catch (error) {
                console.error(
                  `Error processing HTML bundle from ${inputPath}:`,
                  error,
                );

                includeElement.remove();
                return;
              }
            }

            typeCheck<never>(typeCheck.identify(include));

            throw new Error(
              `Invalid include type in "${inputPath}" with the src "${includeElement.getAttribute("src")}" Make sure the "src" attribute points to a valid module.`,
            );
          },
        })
        .on("*", {
          comments: handleComments,
        })
        .onDocument({
          comments: handleComments,
        });

      // TypeScript is confused about the overload here for some reason.
      outputHtml = otherTagsRewriter.transform(outputHtml) as unknown as string;
    }

    // Run the transformation again to ensure that all
    // <knyt-include> tags are replaced. This is necessary because
    // we should process any new <knyt-include> tags that were added
    // to the document by the previous transformation.
    //
    // TODO: This is not ideal, since it can lead to infinite loops
    // if the template contains <knyt-include> tags that reference
    // the same template. While we have a recursion limit, we should
    // try to be smarter about it and detect circular dependencies.
    // For now, let the user deal with it, because it's not worth
    // the effort right now.
    return this.transform(inputPath, outputHtml);
  }
}

/**
 * The header name used to uniquely identify a request.
 *
 * @remarks
 *
 * This header is intended for logging and debugging only.
 * It allows tracing a request throughout the application,
 * but does not affect Glazier's functionality.
 */
export const KNYT_REQUEST_ID = "knyt-request-id";

/**
 * Creates a `BunRequest` object from an absolute path to the input file.
 * This is used to create a request object that can be used
 * in the transformer to retrieve the frontmatter and other data
 * related to the input file.
 *
 * @param inputPath An absolute path to the input file.
 * @returns A `BunRequest` object to be used in the transformer.
 *
 * @internal scope: package
 */
function createRequestFromInputPath(inputPath: string): BunRequest {
  /**
   * The URL of the input file.
   * This is used to create a request object that can be used
   * in the transformer to retrieve the frontmatter and other data
   * related to the input file.
   */
  const url = Bun.pathToFileURL(inputPath);
  /**
   * Parameters for the request.
   *
   * @remarks
   * .
   * This is an empty object, since we don't need any parameters
   * for file only requests.
   * .
   * If the request is used in a route handler, the parameters
   * will be extracted from the URL.
   */
  const params = {};
  const headers = {
    /**
     * This header is used to uniquely identify the request.
     * It is used for logging and debugging purposes.
     */
    [KNYT_REQUEST_ID]: crypto.randomUUID(),
  };

  return createBunRequest(url, params, {
    // TODO: Add support for cancellation.
    // signal: new AbortController().signal,
    headers,
  });
}
