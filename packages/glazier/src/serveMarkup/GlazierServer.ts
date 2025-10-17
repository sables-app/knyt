import defaultGlazierPlugin from "../plugin.ts";
import { originServerState } from "../RequestState/mod.ts";
import {
  isBunHTMLBundleModule,
  transform,
  type BunHTMLBundleModule,
  type GlazierPluginOptions,
  type TransformOptions,
} from "../transform/mod.ts";
import type { RouteHandler } from "../types.ts";

// Banned globals
declare const document: never;
declare const window: never;

function assertRecognizedModule(
  recognizedModule: unknown,
): asserts recognizedModule is GlazierServer.RecognizedModule {
  if (isBunHTMLBundleModule(recognizedModule)) return;

  if (typeof recognizedModule === "string") {
    // Attempt to resolve the path from the current module's directory.
    // The current module's directory is used because the given path
    // should already be fully resolved relative to the caller.
    // This will throw if the path cannot be resolved from this module's directory.
    Bun.resolveSync(recognizedModule, import.meta.dir);
    return;
  }

  throw new Error(`[glazier] Unsupported input type.`);
}

/**
 * @internal scope: package
 */
export class GlazierServer<RoutePath extends string> {
  #recognizedModule: Promise<GlazierServer.RecognizedModule>;
  #options: GlazierPluginOptions;

  constructor(
    input: GlazierServer.Input,
    options: GlazierPluginOptions = defaultGlazierPlugin.options,
  ) {
    this.#recognizedModule = Promise.resolve(input).then(
      (recognizedModule) => (
        assertRecognizedModule(recognizedModule), recognizedModule
      ),
    );
    this.#options = options;
  }

  static #responseInit: ResponseInit = {
    headers: {
      "Content-Type": "text/html",
    },
  };

  #originalHtmlText: string | undefined;

  async #getHtmlSourceFromHTMLBundle(
    htmlModule: BunHTMLBundleModule,
  ): Promise<GlazierServer.HtmlSource> {
    const inputPath = htmlModule.default.index;

    if (this.#originalHtmlText === undefined) {
      this.#originalHtmlText = await Bun.file(inputPath).text();
    }

    return {
      inputPath,
      text: this.#originalHtmlText,
    };
  }

  async #createHtmlSourceFromKnytModulePath(
    inputPath: GlazierServer.KnytModulePath,
  ): Promise<GlazierServer.HtmlSource> {
    // We're dynamically creating the HTML text here;
    // we can only do this, because `GlazierServer` is only used
    // to serve markup, not to bundle and serve an HTML file
    // with its assets. If we were to bundle and serve an HTML file,
    // we would need to write the file to disk first.
    this.#originalHtmlText = `<knyt-include src="${inputPath}"></knyt-include>`;

    return {
      inputPath,
      text: this.#originalHtmlText,
    };
  }

  async #getHtmlSource(): Promise<GlazierServer.HtmlSource> {
    const recognizedModule = await this.#recognizedModule;

    if (isBunHTMLBundleModule(recognizedModule)) {
      return this.#getHtmlSourceFromHTMLBundle(recognizedModule);
    }
    if (typeof recognizedModule === "string") {
      return this.#createHtmlSourceFromKnytModulePath(recognizedModule);
    }

    // This should never happen because of the type assertion in the constructor
    // but we include this to satisfy TypeScript's control flow analysis.

    throw new Error(`[glazier] Unsupported module type.`);
  }

  /**
   * Handles incoming requests and serves markup.
   *
   * @detachable
   */
  readonly fetch: RouteHandler<RoutePath> = async (
    request,
    server,
  ) => {
    const { inputPath, text } = await this.#getHtmlSource();
    const options: TransformOptions = { ...this.#options, request };
    const transformResult = await transform(inputPath, text, options);

    originServerState.associate(request, server);

    const {
      html,
      // TODO: Implement dynamic dependency injection. This should be optional
      // and completely transparent for the user.
      rendererModulePaths: _rendererModulePaths,
    } = transformResult;

    return new Response(html, GlazierServer.#responseInit);
  };
}

export namespace GlazierServer {
  /**
   * A fully resolved path to a Knyt module.
   */
  export type KnytModulePath = string;
  /**
   * Modules recognized by the server for rendering.
   */
  export type RecognizedModule = BunHTMLBundleModule | KnytModulePath;
  /**
   * Unrendered HTML source.
   */
  export type HtmlSource = {
    inputPath: string;
    text: string;
  };
  /**
   * Input types accepted by `GlazierServer` and `serveMarkup`.
   */
  export type Input =
    | GlazierServer.RecognizedModule
    | Promise<GlazierServer.RecognizedModule>;
}
